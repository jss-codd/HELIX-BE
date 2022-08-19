import mongoose from "mongoose";

const Site = mongoose.model(
  "Site",
  new mongoose.Schema(
    {
      name: String,
      corrective_maintenance: {
        labels: [{ type: String }],
        data: [{ type: Number }],
      },
      preventive_maintenance: {
        labels: [{ type: String }],
        data: [{ type: Number }],
      },
      purchases: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Purchase"
        }
      ],
      work_orders: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WorkOrder"
        }
      ],
      energy_consumptions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EnergyConsumption"
        }
      ]
    },
    { timestamps: true }
  )
);

export default Site;
