import mongoose from "mongoose";

const Room = mongoose.model(
  "Room",
  new mongoose.Schema(
    {
      label: String,
      description: String,
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

export default Room;
