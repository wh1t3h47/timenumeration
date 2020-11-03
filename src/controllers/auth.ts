import { Request, Response, NextFunction, Router } from "express";
import Controller from "./controllers.interface";
import AuthenticationService from "../auth/authentication";
import validationMiddleware from "../middleware/validation";
import LogInDto from "../user/logIn.dto";
import bcrypt = require("bcrypt");
import CreateUserDto from "../user/user.dto";
import userModel from "../user/user.model";

class AuthenticationController implements Controller {
  public path = "/auth";
  public router = Router();
  public authenticationService = new AuthenticationService();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/register`,
      validationMiddleware(CreateUserDto),
      this.registration
    );
    this.router.post(
      `${this.path}/login`,
      validationMiddleware(LogInDto),
      this.loggingIn
    );
  }

  private registration = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const userData: CreateUserDto = request.body;
    try {
      const user = await this.authenticationService.register(userData);
      response.send(`Hello ${user}, I love you!`);
    } catch (error) {
      next(error);
    }
  };

  private loggingIn = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const logInData: LogInDto = request.body;
    const user = await this.user.findOne({ email: logInData.email });
    if (user) {
      const isPasswordMatching = await bcrypt.compare(
        logInData.password,
        user.get("password", null, { getters: false })
      );
      if (isPasswordMatching) {
        response.send(user);
        next();
      } else {
        next(
          new Error("wrong user/ password<br>(aha, I'll not give up which one)")
        );
      }
    } else {
      next(
        new Error("wrong user/ password<br>(aha, I'll not give up which one)")
      );
    }
  };
}

export default AuthenticationController;
