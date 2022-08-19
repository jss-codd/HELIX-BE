import mongoose from "mongoose";

const Washroom = mongoose.model(
  "Washroom",
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

export default Washroom;
