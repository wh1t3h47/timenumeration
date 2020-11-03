import Controller from "./controllers.interface";
import { Request, Response, Router } from "express";

class MainController implements Controller {
  public path = "/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router.get(this.path, this.renderView);
  }
  private renderView(req: Request, res: Response) {
    res.render('index');
  }
}

export default MainController;
