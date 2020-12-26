# Robot Control Sandbox

![CI](https://github.com/prototypicalpro/robot-control-sandbox/workflows/CI/badge.svg)

This website is a simple environment to experiment with robot control software and learn about closed loop systems. It was originally built for my [DootCamp robotics talk](https://github.com/prototypicalpro/robot-control-demos).

At the moment the code is very messy but seems to work. The [robot simulation engine](./src/components/RobotSim.tsx) is built using [matter-js](https://brm.io/matter-js/) for physics, [react-vis](https://uber.github.io/react-vis/) for graphing, and [react-simple-code-editor](https://github.com/satya164/react-simple-code-editor) for an interactive code prompt.
