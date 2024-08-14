import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([         // images to send before registerig users 
    {                     //  will add more fields in req.body (default by express)
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
// here when users are directed to register then they will be directed to controllers folder
// example http:localhost:PORT/api/v1/users/register/....

export default router;
// declared in app.js
