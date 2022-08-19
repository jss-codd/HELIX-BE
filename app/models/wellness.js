import mongoose from "mongoose";

const Wellness = mongoose.model(
  "Wellness",
  new mongoose.Schema(
    {
      // name: String,
      // description: String,
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

export default Wellness;
