import db from "../models/index.js";

const sensorConfig = db.sensor_config;

export const getSensorConfig = async (req, res) => {
  try {
    let data = await sensorConfig.find({});
    res.status(200).send(data);
  } catch (error) {
    res.status(403).send(error);
  }
};

export const getSensorConfigById = async (req, res) => {
  try {
    let _id = req.params.id;
    let data = await sensorConfig.findOne(
      { _id: _id },
      function (err, data) {}
    );
    res.status(200).send(data);
  } catch (error) {
    res.status(403).send(error);
  }
};

export const createSensorConfig = async (req, res) => {
  try {
    let payload = req.body;
    const dta = new sensorConfig({
      userId: payload.userId,
      sensor_config: payload.data.config,
      sensorCode: payload.data.sensorCode,
      unit: payload.data.config.unit,
      sensorType: payload.data.sensorType,
    });
    let response = await dta.save();
    res.status(201).send("config created");
  } catch (error) {
    res.status(403).send(error);
  }
};

export const deleteSensorConfigById = async (req, res) => {
  try {
    let payload = req.params;

    const dta = await sensorConfig.findOneAndDelete({ _id: payload.id });
   
    // let response = await dta.save();
    res.status(201).send("config created");
  } catch (error) {
    res.status(403).send(error);
  }
};

export const updateSensorConfigById = async (req, res) => {
  try {
    let payload = req.params;
    let data = req.body
    const dta = await sensorConfig.findByIdAndUpdate({ _id: payload.id },{ sensorCode:data.sensorCode,sensorType:data.sensorType,sensor_config:data.config});
   
    
    // let response = await dta.save();
    res.status(201).send("config created");
  } catch (error) {
    res.status(403).send(error);
  }
};

// export const getSensorConfigBy_Id = async (req, res) => {
//   try {
//     let _id = req.params.id;
//     console.log(_id,"updateSensorConfigById")
//     let data = await sensorConfig.findOne(
//       { _id: _id },
//       function (err, data) {}
//     );
//     res.status(200).send(data);
//   } catch (error) {
//     res.status(403).send(error);
//   }
// };
