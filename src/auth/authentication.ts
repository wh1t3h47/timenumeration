import bcrypt = require("bcrypt");
import { Document } from "mongoose";
import CreateUserDto from "../user/user.dto";
import userModel from "./../user/user.model";
import User from "../user/user.interface";


class AuthenticationService {
  public user = userModel;

  public async register(
    userData: CreateUserDto
  ): Promise<User & Document> {
    if (await this.user.findOne({ email: userData.email })) {
      throw new Error(
        "Oh that is already in use, did I just give you an username enumeration breach?"
      );
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
    });
    return new Promise((resolve) => {
      resolve(user);
    });
  }
}

export default AuthenticationService;
