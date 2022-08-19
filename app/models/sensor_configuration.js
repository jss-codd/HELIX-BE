
import mongoose from "mongoose";

const SensorConfiguration = mongoose.model(
  "SensorConfiguration",
  new mongoose.Schema(
    {
      userId: String,
      sensorCode: String,
      sensorType: String,
      sensor_config:[{
        _id: false,
        label: String,
        defaultValue:Number,
        startRange: Number,
        endRange: Number,
        startRangeDescription: String,
        description: String,
        unit: String,
         }]
    },
    { timestamps: true }
  )
);

export default SensorConfiguration;