export default class MotorModel {
  private readonly maxTorque: number;
  private readonly stuckPowerThresh: number;
  private readonly stuckAngularVelocityThresh: number;
  private readonly frictionCoef: number;

  constructor({
    maxTorque,
    stuckPowerThresh,
    stuckAngularVelocityThresh,
    frictionCoef
  }: {
    maxTorque: number;
    stuckPowerThresh: number;
    stuckAngularVelocityThresh: number;
    frictionCoef: number;
  }) {
    this.maxTorque = maxTorque;
    this.stuckPowerThresh = stuckPowerThresh;
    this.stuckAngularVelocityThresh = stuckAngularVelocityThresh;
    this.frictionCoef = frictionCoef;
  }

  step(deltaTime: number, motorAngularVelocity: number, power: number) {
    // apply a force opposite to the direction the robot is currently moving
    // this simulates the "internal friction" of the motors
    let totalXForce = motorAngularVelocity * this.frictionCoef;
    // if the power is under a certain threshold and the robot is "stopped",
    // the motor stalls and we stop applying any force
    if (
      Math.abs(motorAngularVelocity) >= this.stuckAngularVelocityThresh ||
      Math.abs(power) >= this.stuckPowerThresh
    ) {
      totalXForce += power * this.maxTorque;
    }
    // return the force * time
    return totalXForce * deltaTime;
  }
}
