import mongoose from "mongoose";

const Infrastructure = mongoose.model(
  "Infrastructure",
  new mongoose.Schema(
    {
      name: String,
      description: String,
      location: String,
      solution: String,
      type: { type: String, enum: ["building", "apartment", "mall"] },
      floors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Floor",
        },
      ],
    },
    { timestamps: true }
  )
);

export default Infrastructure;
