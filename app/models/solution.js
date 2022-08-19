import mongoose from "mongoose";

const Solution = mongoose.model(
  "Solution",
  new mongoose.Schema(
    {
      // name: String,
      // description: String,
      solution: String,
      type: { type: String, enum: ["male", "female", "disabled"] },
      sensors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Sensor",
        },
      ],
    },
    { timestamps: true }
  )
);

export default Solution;