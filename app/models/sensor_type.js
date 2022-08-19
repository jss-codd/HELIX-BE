import mongoose from "mongoose";

const SensorType = mongoose.model(
  "SensorType",
  new mongoose.Schema(
    {
      code: String,
      description: String,
      components: [
        {
          component: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Component",
          },
          layout: {
            x: Number,
            y: Number,
            w: Number,
            h: Number,
          },
        },
      ],
    },
    { timestamps: true }
  )
);

export default SensorType;
