import mongoose = require("mongoose");
import User from "./user.interface";

const userSchema = new mongoose.Schema(
  {
    email: String,
    firstName: String,
    lastName: String,
    password: {
      type: String,
      get: (): undefined => undefined,
    },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  }
);

const userModel = mongoose.model<User & mongoose.Document>("User", userSchema);

export default userModel;
