import mongoose from "mongoose";

const WorkOrder = mongoose.model(
  "WorkOrder",
  new mongoose.Schema(
    {
      number: String,
      equipmentNumber: String,
      equipmentName: String,
      make: String,
      market: String,
    },
    { timestamps: true }
  )
);

export default WorkOrder;
