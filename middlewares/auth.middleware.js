import { User } from "../models/user.modal.js";
import { ApiError } from "../utils/APiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const veryfiyJWT = asyncHandler(async (req, res, next) => {
  // cookies we are using because cookieparser was declared in app.js
  try {
    const token =
      req.cookies?.accessToken || // check for the tokens in the cookies
      req.header("Authorization")?.replace("Bearer", ""); // Check for token in Authorization header

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCES_TOKEN_SECRET);

    // ._id is from datamodeling(user.models.js)
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      //
      throw new ApiError(401, "Invalid access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }

  //
});
