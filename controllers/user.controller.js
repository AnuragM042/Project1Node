import { ApiError } from "../utils/APiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccesToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBefore: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong in access or Refresh token");
  }
};

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

  const { fullname, email, username, password } = req.body;
  console.log("email", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // to check if username or email already exists
  });
  console.log("existed user info", existedUser);
  if (existedUser) {
    throw new ApiError(409, "Email or Username already exists");
  }

  // files is from multer here it is used instead of body(exress) check user.routes
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // this is giving an error  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.log("Avatar Path:", avatarLocalPath);
  console.log("CoverIMage Path:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar  file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath); // check uploadOnCloudinary.js for more info
  console.log("Cloudinary Avatar Response: ", avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   check if avatar is not there
  if (!avatar) {
    throw new ApiError(400, "Avatar image not found ");
  }

  if (!coverImage?.url) {
    console.log("User did not filled coverImage input");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url, // only upload url ,
    coverImage: coverImage?.url || "", // if coverimage not there let it be empty
    email,
    password,
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
  return res.status(201).json(
    // not mandatory but good practice to give status code above
    new ApiResponse(200, createdUser, "User Registered Successfully")
  );

  // local path as not uploaded at cloudinary
  // files is from multer here it is used instead of body(exress) check user.routes
  // ? is used to check if avatar and [0] (1st) index property is available
  // now this path is defined in multer.middleware check there for more info
});

const loginUser = asyncHandler(async (req, res) => {
  // algo or TODO
  // req body => data
  // find user
  // password Checker
  // access and refresh token
  // send cookie

  const { email, username, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "username or email error");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    // if user is not found in db (findOne^^)
    throw new ApiError(404, "User not Found");
  }

  // isPasswordCorrect method is created via bycrypt (check user.modals.js)
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken" // optional step
  );

  const options = {
    httpOnly: true, //Security Against XSS (Cross-Site Scripting) Attacks
    secure: true, // Protection Against Man-in-the-Middle (MitM) Attacks
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken, // if user wants to save cookies by himself
          refreshToken,
        },
        "User logged in SuccessFully(cookies)"
      )
    );
  //
});

const logoutUser = asyncHandler(async(req, res)=>{
      
})

export { registerUser, loginUser, logoutUser };
