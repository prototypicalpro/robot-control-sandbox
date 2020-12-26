import * as React from 'react';
import AutoSizer from './AutoSizer';
import RobotSim from './RobotSim';
import Controllers from '../robot-sim-utils/Controllers';

export default function Page() {
  // TODO: detect resize?
  return (
    <AutoSizer>
      {({width, height}) => (
        <RobotSim
          width={width}
          height={height}
          cars={[{powerCoef: 1, color: '#FFA500'}]}
          initialCode={Controllers.NO_CONTROLLER}
          active={true}
        />
      )}
    </AutoSizer>
  );
}
