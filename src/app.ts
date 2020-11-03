import bodyParser = require("body-parser");
import express = require("express");
import mongoose = require("mongoose");
import Controller from "./controllers/controllers.interface";
import dotenv = require("dotenv");
dotenv.config();

class App {
  public app: express.Application;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.app.set("views", "./views");
    this.app.set("view engine", "pug");

    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
  }

  public listen(): void {
    this.app.listen(8000, () => {
      console.log(`App listening on the port 8000`);
    });
  }

  public getServer(): Express.Application {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use("/", controller.router);
    });
  }

  private connectToTheDatabase() {
    const { DB_HOST } = process.env;
    mongoose.connect(`mongodb://${DB_HOST}`);
  }
}

export default App;
