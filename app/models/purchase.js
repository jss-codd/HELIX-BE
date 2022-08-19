import mongoose from "mongoose";

const Purchase = mongoose.model(
  "Purchase",
  new mongoose.Schema(
    {
      number: String,
      status: String,
    },
    { timestamps: true }
  )
);

export default Purchase;
