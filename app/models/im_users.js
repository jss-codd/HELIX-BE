import mongoose from "mongoose";

const ImUsers = mongoose.model(
  "ImUsers",
  new mongoose.Schema(
    {
      username:String,
      email:String,
      role:String,
      subId:String,
      parentUser:String,
      parentRole:String,
      assignPermissions:{
        type:[String],
        optional:true
      },
      logoId:String,
      profileLogoId: String,
    },
    { timestamps: true }
  )
);

export default ImUsers;
