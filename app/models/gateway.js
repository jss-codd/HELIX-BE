import mongoose from "mongoose";

const Gateway = mongoose.model(
  "Gateway",
  new mongoose.Schema(
    {
      gateway_id: String,
      region: String,
      city: String,
      state: String,
      company: String,
      company_unit: String,
      solution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Solution",
      },
      washroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Washroom",
      },
      wellness: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wellness",
      },
      room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
      solutionType: String,
    },
    { timestamps: true }
  )
);

export default Gateway;
