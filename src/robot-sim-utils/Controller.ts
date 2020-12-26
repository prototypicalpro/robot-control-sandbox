export interface Controller {
  step(data: {
    time: number;
    delta: number;
    sensorDistance: number;
    sensorVelocity: number;
  }): number;
}

export interface ControllerFactory {
  new (): Controller;
}
