import AuthController from "./controllers/auth";
import MainController from "./controllers/renderView";
import App from "./app";

const app = new App([
  new MainController(),
  new AuthController(),
]);

app.listen();