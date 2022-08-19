import mongoose from "mongoose";
const DeviceConfiguration = mongoose.model(
    "DeviceConfiguration",
    new mongoose.Schema(
      {
        sensor_id: String,
        sensor_config:[{
          _id: false,
          label: String,
          defaultValue:Number,
          startRange: Number,
          endRange: Number,
          startRangeDescription: String,
          endRangeDescription: String,
          selectedValue: Number
           }]
      },
      { timestamps: true }
    )
  );
  
  export default DeviceConfiguration;