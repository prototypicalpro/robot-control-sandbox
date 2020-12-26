import * as React from 'react';
import AutoSizer from './AutoSizer';
import RobotSim from './RobotSim';

export default function Page() {
  // TODO: detect resize?
  return (
    <AutoSizer>
      {({width, height}) => (
        <RobotSim width={width} height={height} active={true} />
      )}
    </AutoSizer>
  );
}
