import mongoose from "mongoose";

const EnergyConsumption = mongoose.model(
  "EnergyConsumption",
  new mongoose.Schema(
    {
      equipmentNumber: String,
      date: Date,
      value: Number,
      type: String,
    },
    { timestamps: true }
  )
);

export default EnergyConsumption;
