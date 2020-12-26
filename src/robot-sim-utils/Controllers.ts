const Controllers = {
  NO_CONTROLLER: `
class Controller {
  step() {
    return 0
  }
}`.trim(),

  TIME_CONTROLLER: `
const DRIVE_TIME = 1.8;

class Controller {
  constructor() {
    this.initialTime = null
  }

  step({time}) {
    if (this.initialTime === null)
      this.initialTime = time
    const timeHasPassed = time - this.initialTime
    if (timeHasPassed > DRIVE_TIME) return 0
    else return 1
  }
}`.trim(),

  BANG_BANG_CONTROLLER: `
class Controller {
  step({sensorDistance}) {
    if (sensorDistance > 0) return 1
    else if (sensorDistance < 0) return -1
    else return 0
  }
}`.trim(),

  P_CONTROLLER: `
const P_TERM = 0;

class Controller {
  step({sensorDistance}) {
    return sensorDistance*P_TERM;
  }
}`.trim(),

  PI_CONTROLLER: `
const P_TERM = 0.003;
const I_TERM = 0;
const I_CUTOFF = 0;

class Controller {
  constructor() {
    this.integral = 0
  }

  step({sensorDistance, delta}) {
    if (Math.abs(sensorDistance) > I_CUTOFF) {
      this.integral = 0
    }
    else {
      this.integral += sensorDistance*delta
    }

    return sensorDistance*P_TERM + this.integral*I_TERM
  }
}`.trim(),

  PID_CONTROLLER: `
const P_TERM = 0.003, I_TERM = 0.001, I_CUTOFF = 20, D_TERM = .003;

class Controller {
  constructor() { this.integral = 0, this.prevDistance = null }

  step({sensorDistance, delta}) {
    if (this.prevDistance === null) this.prevDistance = sensorDistance

    if (Math.abs(sensorDistance) > I_CUTOFF) this.integral = 0
    else this.integral += sensorDistance * delta

    let der = (sensorDistance - this.prevDistance) / delta
    this.prevDistance = sensorDistance

    return sensorDistance*P_TERM + this.integral*I_TERM + der*D_TERM
  }
}`.trim(),

  MOTION_PROFILE_CONTROLLER: `
const CRUISE_VELOCITY = 200, MAX_ACCEL = 200, CORNER_TIME = CRUISE_VELOCITY / MAX_ACCEL;
const V_TERM = 0.0013, P_TERM = -0.004;

class Controller {
  constructor() { this.totalDistance = null; this.initialTime = null; }

  getDesiredVelocityAndPosition(time) {
    const cruiseDistance =
      this.totalDistance - CRUISE_VELOCITY * CORNER_TIME;
    const cruiseTime = cruiseDistance / CRUISE_VELOCITY;
    const backCornerTime = CORNER_TIME + cruiseTime;

    let velocity;
    if (time < CORNER_TIME) {
      velocity = (CRUISE_VELOCITY / CORNER_TIME) * time;
    } else if (time < backCornerTime) {
      velocity = CRUISE_VELOCITY;
    } else {
      velocity = Math.max(
        (CRUISE_VELOCITY / CORNER_TIME) * (backCornerTime - time) +
          CRUISE_VELOCITY,
        0
      );
    }

    let position;
    if (time < CORNER_TIME) position = 0.5 * MAX_ACCEL * Math.pow(time, 2);
    else if (time < backCornerTime)
      position = 0.5 * MAX_ACCEL * Math.pow(CORNER_TIME, 2) + CRUISE_VELOCITY * (time - CORNER_TIME);
    else if (time < backCornerTime + CORNER_TIME)
      position =
        0.5 * MAX_ACCEL * Math.pow(CORNER_TIME, 2) +
        CRUISE_VELOCITY * cruiseTime +
        CRUISE_VELOCITY * (time - backCornerTime) - 0.5 * MAX_ACCEL * Math.pow(time - backCornerTime, 2);
    else position = this.totalDistance

    console.log(time, position)
    return {position, velocity};
  }

  step({sensorDistance, delta, time}) {
    if (this.totalDistance === null) {
      this.totalDistance = sensorDistance;
      this.initialTime = time;
    }

    const {position, velocity} = this.getDesiredVelocityAndPosition((time - this.initialTime));
    const error = (this.totalDistance - position) - sensorDistance;
    return V_TERM*velocity + P_TERM*error;
  }
}
`.trim()
};

export default Controllers;
