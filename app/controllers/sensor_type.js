import db from "../models/index.js";


const SensorType = db.sensor_type;

export const getSensorTypes = async (req, res) => {
  SensorType.find().exec((err, sensor_types) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.status(200).send(sensor_types);
    }
  });
};

export const createSensorType = async (req, res) => {
  const { code, description, components } = req.body;

  SensorType.create({
    code,
    description,
    components,
  })
    .then((sensor_type) => {
      res.status(200).send(sensor_type);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err);
    });
};

export const updateSensorType = async (req, res) => {
  const { sensorTypeId } = req.params;
  const { code, description, components } = req.body;

  SensorType.findByIdAndUpdate(sensorTypeId, {
    code,
    description,
    components,
  }).exec((err, sensor_type) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.status(200).send(sensor_type);
    }
  });
};

export const deleteSensorType = async (req, res) => {
  const { sensorTypeId } = req.params;

  SensorType.findByIdAndDelete(sensorTypeId).exec((err, sensor_type) => {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.status(200).send(sensor_type);
    }
  });
};


