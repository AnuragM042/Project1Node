import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { veryfiyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)


//secured routes
router.route("/logout").post(veryfiyJWT ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;
// declared in app.js
