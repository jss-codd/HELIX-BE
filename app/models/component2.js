import mongoose from "mongoose";

const Component2 = mongoose.model(
  "Component2",
  new mongoose.Schema(
    {
      type: String,
      key: String,
      description: String,
      gateway: String,
      sensor: String,
      layout: {
        x: Number,
        y: Number,
        w: Number,
        h: Number,
      },
    },
    { timestamps: true }
  )
);

export default Component2;
