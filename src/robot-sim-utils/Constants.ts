import {Common, Body} from 'matter-js';

export enum OBJECT_ID {
  SENSOR_B = Common.nextId()
}

export enum COLLISION_CATEGORY {
  WALLS = Body.nextCategory(),
  CARS = Body.nextCategory(),
  SENSOR = Body.nextCategory()
}
