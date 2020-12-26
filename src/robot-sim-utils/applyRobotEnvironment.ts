import {World, Bodies, Body, Composite, Constraint} from 'matter-js';
import {OBJECT_ID, COLLISION_CATEGORY} from './Constants';

// const NO_DENSITY = 1e-30;

/**
 * Creates a composite with simple car setup of bodies and constraints.
 *
 * @param {number} xx
 * @param {number} yy
 * @param {number} width
 * @param {number} height
 * @param {number} wheelSize
 * @returns {composite} A new composite car body
 */
export function makeCarComposite(
  xx: number,
  yy: number,
  width: number,
  height: number,
  wheelSize: number,
  wheelFriction: number,
  color?: {
    flag?: string;
    body?: string;
    wheels?: string;
    flagPole?: string;
  }
): [Composite, {body: Body; wheelBack: Body; wheelFront: Body}] {
  const wheelBase = 20,
    wheelAOffset = -width * 0.5 + wheelBase,
    wheelBOffset = width * 0.5 - wheelBase,
    wheelYOffset = width * 0.5 - wheelBase;
  // flagXOffset = width * -0.5,
  // flagYOffset = height * -0.5;
  const bodyGroup = Body.nextGroup(false);

  const car = Composite.create({label: 'Car'});
  const body = Bodies.rectangle(xx, yy, width, height, {
    collisionFilter: {
      category: COLLISION_CATEGORY.CARS,
      mask: COLLISION_CATEGORY.WALLS,
      group: bodyGroup
    },
    density: 0.0001,
    render: {
      fillStyle: color?.body
    }
  });

  Body.rotate(body, Math.PI);

  const wheelBack = Bodies.circle(
    xx + wheelAOffset,
    yy + wheelYOffset,
    wheelSize,
    {
      collisionFilter: {
        category: COLLISION_CATEGORY.CARS,
        mask: COLLISION_CATEGORY.WALLS
      },
      friction: wheelFriction,
      render: {
        fillStyle: color?.wheels
      }
    }
  );

  const wheelFront = Bodies.circle(
    xx + wheelBOffset,
    yy + wheelYOffset,
    wheelSize,
    {
      collisionFilter: {
        category: COLLISION_CATEGORY.CARS,
        mask: COLLISION_CATEGORY.WALLS
      },
      friction: wheelFriction,
      render: {
        fillStyle: color?.wheels
      }
    }
  );

  const axelBack = Constraint.create({
    bodyB: body,
    pointB: {x: wheelAOffset, y: wheelYOffset},
    bodyA: wheelBack,
    stiffness: 1,
    length: 0,
    render: {
      visible: false
    }
  });

  const axelFront = Constraint.create({
    bodyB: body,
    pointB: {x: wheelBOffset, y: wheelYOffset},
    bodyA: wheelFront,
    stiffness: 1,
    length: 0,
    render: {
      visible: false
    }
  });

  // const particleRadius = 5;
  // const rowCount = 5;
  // const flagPole = Composites.softBody(
  //   xx + flagXOffset - particleRadius,
  //   yy + flagYOffset - particleRadius * (2 * rowCount - 1),
  //   2,
  //   rowCount,
  //   0,
  //   0,
  //   true,
  //   particleRadius,
  //   {
  //     render: {
  //       visible: true,
  //       fillStyle: color?.flagPole
  //     },
  //     density: 0.001,
  //     slop: 0.005,
  //     collisionFilter: {
  //       category: COLLISION_CATEGORY.CARS,
  //       mask: COLLISION_CATEGORY.WALLS,
  //       group: bodyGroup
  //     }
  //   },
  //   {
  //     stiffness: 0.5
  //   }
  // );

  // const leftFlagMountPoint = flagPole.bodies[flagPole.bodies.length - 2];
  // const rightFlagMountPoint = flagPole.bodies[flagPole.bodies.length - 1];

  // const flagBodyLeft = Constraint.create({
  //   bodyB: body,
  //   pointB: {x: flagXOffset, y: flagYOffset},
  //   bodyA: leftFlagMountPoint,
  //   stiffness: 1,
  //   length: 0
  // });

  // const flagBodyRight = Constraint.create({
  //   bodyB: body,
  //   pointB: {x: flagXOffset + 2 * particleRadius, y: flagYOffset},
  //   bodyA: rightFlagMountPoint,
  //   stiffness: 1,
  //   length: 0
  // });

  // const flagRadius = (4 * particleRadius) / Math.sqrt(3);
  // const flagTriangle = Bodies.polygon(
  //   xx + flagXOffset - 2 * particleRadius - 2,
  //   yy + flagYOffset - particleRadius * (rowCount + 1),
  //   3,
  //   flagRadius,
  //   {
  //     density: NO_DENSITY,
  //     collisionFilter: {
  //       category: COLLISION_CATEGORY.CARS,
  //       mask: COLLISION_CATEGORY.WALLS,
  //       group: bodyGroup
  //     },
  //     render: {
  //       fillStyle: color?.flag
  //     }
  //   }
  // );

  // const flagMount = Constraint.create({
  //   bodyB: flagPole.bodies[2],
  //   pointB: {x: 0, y: 0},
  //   bodyA: flagTriangle,
  //   pointA: {x: flagRadius / 2, y: 0},
  //   stiffness: 0.9
  // });

  Composite.add(car, body);
  Composite.add(car, wheelBack);
  Composite.add(car, wheelFront);
  Composite.add(car, axelBack);
  Composite.add(car, axelFront);
  // Composite.add(car, flagPole);
  // Composite.add(car, flagBodyLeft);
  // Composite.add(car, flagBodyRight);
  // Composite.add(car, flagTriangle);
  // Composite.add(car, flagMount);

  return [
    car,
    {
      body,
      wheelBack,
      wheelFront
    }
  ];
}

export function applyRobotEnvironment(
  world: World,
  width: number,
  height: number,
  color?: {
    walls?: string;
  }
) {
  // walls
  const wallOpts = {
    isStatic: true,
    render: {fillStyle: color?.walls},
    collisionFilter: {
      category: COLLISION_CATEGORY.WALLS,
      mask: COLLISION_CATEGORY.CARS
    }
  };
  World.add(world, [
    // walls
    Bodies.rectangle(width / 2, 0, width, 50, wallOpts),
    Bodies.rectangle(width / 2, height, width, 50, wallOpts),
    Bodies.rectangle(width, height / 2, 50, height, wallOpts),
    Bodies.rectangle(0, height / 2, 50, height, wallOpts)
  ]);
  // create the destination point
  const pointB = Bodies.rectangle(width * 0.8, height / 2, 1, height, {
    isStatic: true,
    id: OBJECT_ID.SENSOR_B,
    collisionFilter: {
      category: COLLISION_CATEGORY.SENSOR
    },
    render: {
      strokeStyle: 'black',
      fillStyle: 'transparent',
      lineWidth: 1
    }
  });
  World.add(world, pointB);

  return {
    pointB
  };
}
