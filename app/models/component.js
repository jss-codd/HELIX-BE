import mongoose from "mongoose";

const Component = mongoose.model(
  "Component",
  new mongoose.Schema(
    {
      name: String,
      type: { type: String, enum: ["text", "image"] },
      data_key: String,
      unit: String,
      icon_url: String,
      title: String,
      text_color: String,
      background_color: String,
    },
    { timestamps: true }
  )
);

export default Component;
