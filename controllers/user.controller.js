import { ApiError } from "../utils/APiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Todo/ Algorithm
  // get user details from frontend
  // validation -- not empty
  // check if user already exits: using username, email
  // check avatar (images) {compolsary items}
  // upload in cloudinary, avatar
  // create user object (nosql) - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return  response

  const { fullname, email, username, passowrd } = req.body;
  console.log("email", email);

  if (
    [fullname, email, username, passowrd].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }], // to check if username or email already exists
  });
  console.log("existed user info", existedUser);
  if (existedUser) {
    throw new ApiError(409, "Email or Username already exists");
  }

  // files is from multer here it is used instead of body(exress) check user.routes
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // coverImage is not explicitly check because it is not compalsary
  // validate coverImage while uploading/ creating db below

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar  file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath); // check uploadOnCloudinary.js for more info
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   check if avatar is not there
  if (!avatar) {
    throw new ApiError(400, "Avatar image not found ");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url, // only upload url ,
    coverImage: coverImage?.url || "", // if coverimage not there let it be empty
    email,
    passowrd,
    username: username.toLowerCase(),
  });

  // to check if user is created
  // select by defaults selects everything
  // to unselect use - sign and object name inside a string
  // for multiple objs give space inside the string
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while searching the user ");
  }
  console.log("avatar files are here ", avatarLocalPath);
  return res.status(201).json(   // not mandatory but good practice to give status code above
    new ApiResponse(200, createdUser, "User Registered Successfully")
  )

  // local path as not uploaded at cloudinary
  // files is from multer here it is used instead of body(exress) check user.routes
  // ? is used to check if avatar and [0] (1st) index property is available
  // now this path is defined in multer.middleware check there for more info

});

export { registerUser };
