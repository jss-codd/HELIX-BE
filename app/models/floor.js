import mongoose from "mongoose";

const Floor = mongoose.model(
  "Floor",
  new mongoose.Schema(
    {
      description: String,
      sign: String,
      index: Number,
      solutions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Solution",
      }],
      washrooms: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Washroom",
        },
      ],
      wellnesses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Wellness",
        },
      ],
      rooms: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
        },
      ],
     
    },
    { timestamps: true }
  )
);

export default Floor;
