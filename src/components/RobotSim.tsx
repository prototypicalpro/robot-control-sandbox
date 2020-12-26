import * as React from 'react';
import {Engine, Render, World, Events, Body, Vector, Runner} from 'matter-js';
import '../../node_modules/react-vis/dist/style.css';
import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  LineSeriesCanvas
} from 'react-vis';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {
  applyRobotEnvironment,
  makeCarComposite
} from '../robot-sim-utils/applyRobotEnvironment';
import DataWindow from '../robot-sim-utils/DataWindow';
import MotorModel from '../robot-sim-utils/MotorModel';
import {Controller, ControllerFactory} from '../robot-sim-utils/Controller';
import ControllerEditor from './ControllerEditor';
import Controllers from '../robot-sim-utils/Controllers';
import './RobotSim.css';

const CAR_SCALE = 0.8;
const WINDOW_SIZE = 300;
const MIN_GRAPH_TIME = 500;
const GRAPH_TICK_WAIT = 0;
const MOTOR_SETTINGS = {
  frictionCoef: -0.001,
  maxTorque: 0.0006,
  stuckPowerThresh: 0.05,
  stuckAngularVelocityThresh: 0.5
};

const CAR_CONFIGURATIONS = {
  THREE_ROBOTS: {
    name: 'Three Robots',
    config: [
      {powerCoef: 1, color: '#ff0000'},
      {powerCoef: 0.9, color: '#00ff00'},
      {powerCoef: 0.8, color: '#0000ff'}
    ]
  },
  SINGLE_ROBOT: {
    name: 'Single Robot',
    config: [{powerCoef: 1, color: '#FFA500'}]
  }
};

const CAR_CONFIG_MAP = new Map(
  Object.values(CAR_CONFIGURATIONS).map(({name, config}) => [name, config])
);
const CONTROLLER_MAP = new Map(
  Object.values(Controllers).map(({name, code}) => [name, code])
);

function driveWheel(wheel: Body, force: number) {
  Body.applyForce(
    wheel,
    Vector.add(wheel.position, Vector.create(0, wheel.circleRadius)),
    Vector.create(-force, 0)
  );
  Body.applyForce(
    wheel,
    Vector.add(
      wheel.position,
      Vector.create(0, -(wheel.circleRadius as number))
    ),
    Vector.create(force, 0)
  );
}

const RobotSim: React.FunctionComponent<{
  width: number;
  height: number;
  style?: React.CSSProperties;
  className?: string;
  active?: boolean;
}> = ({style, className, width, height, active}) => {
  const [simulationActive, setSimulationActive] = React.useState(false);
  const [simulationNumber, setSimulationNumber] = React.useState(1);
  const [curTick, setCurTick] = React.useState(0);
  const [codeSelection, setCodeSelection] = React.useState(
    Controllers.NO_CONTROLLER
  );
  const [factory, setFactory] = React.useState<{factory: ControllerFactory}>();
  const [carSelection, setCarSelection] = React.useState(CAR_CONFIGURATIONS.THREE_ROBOTS);
  const proccessedTickRef = React.useRef<number>(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const engineRef = React.useRef(Engine.create());
  const rendererRef = React.useRef<Render>();
  const runnerRef = React.useRef<Runner>();
  const wheelsRef = React.useRef<
    {
      wheelFront: Body;
      wheelBack: Body;
      body: Body;
      positionWindow: DataWindow<number>;
      velocityWindow: DataWindow<number>;
      powerWindow: DataWindow<number>;
      motorFront: MotorModel;
      motorBack: MotorModel;
      controller: Controller;
      powerCoef: number;
      color: string;
    }[]
  >();
  const pointBRef = React.useRef<Body>();
  const tickWindowRef = React.useRef<DataWindow<DOMHighResTimeStamp>>();

  const canvasHeight = height / 3;
  const canvasWidth = width;

  // setup engine and world
  React.useEffect(() => {
    if (canvasRef.current && factory && simulationNumber && active) {
      // reset the engine
      engineRef.current = Engine.create();
      // reset the processed tick and current tick
      tickWindowRef.current = new DataWindow(WINDOW_SIZE);
      setCurTick(0);
      proccessedTickRef.current = 0;
      setSimulationActive(false);
      // generate the environment
      const {pointB} = applyRobotEnvironment(
        engineRef.current.world,
        canvasWidth,
        canvasHeight
      );
      pointBRef.current = pointB;
      // generate a number of cars
      wheelsRef.current = [];
      for (const {powerCoef, color} of carSelection.config) {
        const [car, carParts] = makeCarComposite(
          150,
          canvasHeight - 95,
          150 * CAR_SCALE,
          150 * CAR_SCALE,
          40 * CAR_SCALE,
          0.2,
          {
            body: `${color}a0`,
            wheels: `${color}a0`,
            flag: '#ff4500a0',
            flagPole: `${color}a0`
          }
        );
        World.add(engineRef.current.world, car);
        wheelsRef.current.push({
          ...carParts,
          positionWindow: new DataWindow(WINDOW_SIZE),
          velocityWindow: new DataWindow(WINDOW_SIZE),
          powerWindow: new DataWindow(WINDOW_SIZE),
          motorBack: new MotorModel(MOTOR_SETTINGS),
          motorFront: new MotorModel(MOTOR_SETTINGS),
          controller: new factory.factory(),
          powerCoef,
          color
        });
      }
      // generate a renderer
      rendererRef.current = Render.create({
        canvas: canvasRef.current,
        engine: engineRef.current,
        options: {
          width: canvasWidth,
          height: canvasHeight,
          wireframes: false,
          showAngleIndicator: true,
          background: '#d4d4d4'
          // showCollisions: true
        } as any
      });
      // set react to tick with the engine
      Events.on(engineRef.current, 'afterTick', ({timestamp}) =>
        setCurTick(timestamp)
      );
      // fit the render viewport to the scene
      Render.lookAt(rendererRef.current, {
        min: {x: 0, y: 0},
        max: {x: canvasWidth, y: canvasHeight}
      });
      // run the Renderer once for a start freeze frame
      Render.world(rendererRef.current);
      // start the physics runner
      // we let it run independently because react is too slow to keep up
      runnerRef.current = Runner.create();
      // cleanup
      return () => {
        // stop the runner
        if (runnerRef.current) {
          Runner.stop(runnerRef.current);
          runnerRef.current = undefined;
        }
      };
    }
  }, [
    canvasRef,
    engineRef,
    rendererRef,
    canvasWidth,
    canvasHeight,
    carSelection,
    simulationNumber,
    active,
    factory
  ]);

  // handle play/pause changes
  React.useEffect(() => {
    if (runnerRef.current && engineRef.current && simulationActive && active) {
      Runner.start(runnerRef.current, engineRef.current);
      return () => Runner.stop(runnerRef.current as Runner);
    }
  }, [runnerRef, engineRef, simulationActive, active]);

  // handle ticks
  React.useEffect(() => {
    if (
      rendererRef.current &&
      tickWindowRef.current &&
      wheelsRef.current &&
      pointBRef.current &&
      proccessedTickRef.current < curTick
    ) {
      // render the world
      Render.world(rendererRef.current);
      // every someodd ticks, update the graph
      if (proccessedTickRef.current + GRAPH_TICK_WAIT < curTick) {
        // indicate we have processed the next tick
        proccessedTickRef.current = curTick;
        // calculate vectors
        const delta = curTick - (tickWindowRef.current.recent() || 0);
        // update tick state
        tickWindowRef.current.addData(curTick);
        // update the model cars
        for (const {
          wheelBack,
          wheelFront,
          motorBack,
          motorFront,
          controller,
          body,
          positionWindow,
          velocityWindow,
          powerWindow,
          powerCoef
        } of wheelsRef.current) {
          // calculate velocities and such
          const dist = pointBRef.current.position.x - body.position.x;
          const velocity = positionWindow.recent()
            ? -(dist - positionWindow.recent()) / (delta / 1e3)
            : 0;
          // update other state
          positionWindow.addData(dist);
          velocityWindow.addData(velocity);
          const rawPower = Math.min(
            1,
            Math.max(
              -1,
              controller.step({
                sensorDistance: dist,
                delta: delta / 1e3, // milliseconds to seconds
                time: curTick / 1e3,
                sensorVelocity: velocity
              })
            )
          );
          // run the controller
          const power = rawPower * powerCoef;
          powerWindow.addData(power);
          // step the motors based on the values we just calculated
          const frontPower = motorFront.step(
            delta,
            wheelFront.angularVelocity,
            power
          );
          const backPower = motorBack.step(
            delta,
            wheelBack.angularVelocity,
            power
          );
          // apply forces
          driveWheel(wheelFront, frontPower);
          driveWheel(wheelBack, backPower);
        }
      }
    }
  }, [curTick]);

  // generate data by zipping the tickWindow with all the other properties
  const res = React.useMemo(() => {
    if (tickWindowRef.current && wheelsRef.current) {
      const tickVal = tickWindowRef.current.values();
      return {
        timeDomain:
          tickVal.length > 2 && tickVal[tickVal.length - 1] > MIN_GRAPH_TIME
            ? [tickVal[0], tickVal[tickVal.length - 1]]
            : [0, MIN_GRAPH_TIME],
        position: wheelsRef.current.map(({positionWindow, color}) => ({
          data: positionWindow.values().map((y, i) => ({x: tickVal[i], y})),
          color
        })),
        velocity: wheelsRef.current.map(({velocityWindow, color}) => ({
          data: velocityWindow.values().map((y, i) => ({x: tickVal[i], y})),
          color
        })),
        power: wheelsRef.current.map(({powerWindow, color}) => ({
          data: powerWindow.values().map((y, i) => ({x: tickVal[i], y})),
          color
        }))
      };
    } else
      return {
        timeDomain: [0, MIN_GRAPH_TIME],
        position: [],
        velocity: [],
        power: []
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proccessedTickRef.current]);

  const axisStyle = {
    text: {fontSize: '1.2em', fill: '#d4d4d4'},
    title: {fontSize: '1.1em', fill: '#d4d4d4'}
  };

  return (
    <div className="robot-sim-container" style={{width, height, ...style}}>
      <canvas
        className={className}
        ref={canvasRef}
        width={width}
        height={canvasHeight}
        style={{gridArea: 'canvas'}}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gridArea: 'editor',
          overflowY: 'auto'
        }}
      >
        <ControllerEditor
          onCodeUpdate={factory => setFactory({factory})}
          initialCode={codeSelection.code}
          style={{flexGrow: 1}}
        />
        <div style={{display: 'flex', alignContent: 'center'}}>
          <Form.Control
            as="select"
            size="lg"
            style={{width: 'auto', marginRight: '0.4em'}}
            value={codeSelection.name}
            onChange={e =>
              setCodeSelection({
                name: e.target.value,
                code: CONTROLLER_MAP.get(e.target.value) as string
              })
            }
          >
            {Array.from(CONTROLLER_MAP.keys()).map(name => (
              <option key={name}>{name}</option>
            ))}
          </Form.Control>
          <Form.Control
            as="select"
            size="lg"
            style={{width: 'auto', marginRight: '0.4em'}}
            value={carSelection.name}
            onChange={e =>
              setCarSelection({
                name: e.target.value,
                config: CAR_CONFIG_MAP.get(e.target.value) as any
              })
            }
          >
            {Array.from(CAR_CONFIG_MAP.keys()).map(name => (
              <option key={name}>{name}</option>
            ))}
          </Form.Control>
          <Button
            variant="danger"
            size="lg"
            onClick={() => setSimulationNumber(simulationNumber + 1)}
            style={{marginRight: '0.4em'}}
          >
            Reload
          </Button>
          {simulationActive ? (
            <Button
              variant="warning"
              size="lg"
              onClick={() => {
                setSimulationActive(false);
              }}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="success"
              size="lg"
              onClick={() => {
                setSimulationActive(true);
              }}
            >
              Play
            </Button>
          )}
        </div>
      </div>
      <XYPlot
        xDomain={res.timeDomain}
        yDomain={[-1.1, 1.1]}
        width={width / 5}
        height={(height / 3) * 2}
        margin={{left: 65}}
        dontCheckIfEmpty
      >
        <HorizontalGridLines />
        {res.power.map(({data, color}, i) => (
          <LineSeriesCanvas key={i} data={data} color={color} />
        ))}
        <XAxis style={axisStyle} title="Time (ms)" tickTotal={5} />
        <YAxis style={axisStyle} title="Power" />
      </XYPlot>
      <XYPlot
        xDomain={res.timeDomain}
        yDomain={[-400, width - 200]}
        width={width / 5}
        height={(height / 3) * 2}
        margin={{left: 65}}
        dontCheckIfEmpty
      >
        <HorizontalGridLines />
        {res.position.map(({data, color}, i) => (
          <LineSeriesCanvas key={i} data={data} color={color} />
        ))}
        <XAxis style={axisStyle} title="Time (ms)" tickTotal={5} />
        <YAxis style={axisStyle} title="Distance (px)" />
      </XYPlot>
      <XYPlot
        xDomain={res.timeDomain}
        yDomain={[-600, 1000]}
        width={width / 5}
        height={(height / 3) * 2}
        margin={{left: 65}}
        dontCheckIfEmpty
      >
        <HorizontalGridLines />
        {res.velocity.map(({data, color}, i) => (
          <LineSeriesCanvas key={i} data={data} color={color} />
        ))}
        <XAxis style={axisStyle} title="Time (ms)" tickTotal={5} />
        <YAxis style={axisStyle} title="Velocity (px/s)" />
      </XYPlot>
    </div>
  );
};

export default RobotSim;
