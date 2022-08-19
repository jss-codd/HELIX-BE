import mongoose from "mongoose";

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      sub: String,
      given_name: String,
      family_name: String,
      email: String,
      logo: String,
      profile_logo: String,
      roles: [String],
      solutions: [String],
      infrastructures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Infrastructure",
        },
      ],
      gateways: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Gateway",
        },
      ],
    },
    { timestamps: true }
  )
);

export default User;
