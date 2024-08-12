import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);
// here when users are directed to register then they will be directed to controllers folder
// example http:localhost:PORT/api/v1/users/register/.... 

export default router;
// declared in app.js
