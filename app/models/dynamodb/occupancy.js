import dynamo from "../../config/dynamo.js";
import Joi from "joi";

const Occupancy = dynamo.define("Occupancy", {
  hashKey: "deviceid",

  // add the timestamp attributes (updatedAt, createdAt)
  timestamps: true,

  schema: {
    deviceid: Joi.string(),
    timez: Joi.date(),
    batVolt: Joi.number(),
    co2Value: Joi.number(),
    humidit: Joi.number(),
    iaq: Joi.number(),
    lux: Joi.number(),
    occupancyCount: Joi.number(),
    occupancyStatus: Joi.number(),
    pressur: Joi.number(),
    staticIaqValue: Joi.number(),
    temperatur: Joi.number(),
    voc: Joi.number(),
  },
});

export default Occupancy;
