// Importing required modules and utilities
import { ApiError } from "../utils/APiError.js"; // Custom error class for handling API errors
import { asyncHandler } from "../utils/asyncHandler.js"; // Utility to handle async errors
import { User } from "../models/user.modal.js"; // User model for interacting with the database
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Utility to upload files to Cloudinary
import { ApiResponse } from "../utils/ApiResponse.js"; // Custom class to format API responses
import jwt from "jsonwebtoken";

// Function to generate access and refresh tokens for a user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Find the user in the database using their ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate an access token using a method defined in the User model
    const accessToken = user.generateAccessToken();

    // Generate a refresh token using a method defined in the User model
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token to the user document in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Return both tokens
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error during token generation:", error);
    throw new ApiError(
      500,
      "Something went wrong in access or Refresh token",
      error
    );
  }
};

// Function to handle user registration
const registerUser = asyncHandler(async (req, res) => {
  // 1. Extract user details from the request body
  const { fullname, email, username, password } = req.body;
  console.log("email", email);

  // 2. Validate the user details (ensure none of the fields are empty)
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3. Check if a user with the same username or email already exists in the database
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existed user info", existedUser);
  if (existedUser) {
    throw new ApiError(409, "Email or Username already exists");
  }

  // 4. Check if avatar image is provided in the request files (using multer)
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // 5. Check if cover image is provided (this section was giving an error earlier)
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

  // 6. Ensure avatar is provided; if not, throw an error
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 7. Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("Cloudinary Avatar Response: ", avatar);

  // 8. Upload cover image to Cloudinary (if provided)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // 9. Ensure avatar upload was successful
  if (!avatar) {
    throw new ApiError(400, "Avatar image not found ");
  }

  // 10. Check if cover image was uploaded; if not, log a message
  if (!coverImage?.url) {
    console.log("User did not fill coverImage input");
  }

  // 11. Create a new user object in the database
  const user = await User.create({
    fullname,
    avatar: avatar.url, // Store only the avatar URL
    coverImage: coverImage?.url || "", // Store cover image URL if provided, else empty string
    email,
    password,
    username: username.toLowerCase(), // Convert username to lowercase
  });

  // 12. Fetch the newly created user and exclude password and refreshToken fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while searching the user");
  }

  console.log("avatar files are here ", avatarLocalPath);

  // 13. Send a success response with the created user data
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

// Function to handle user login
const loginUser = asyncHandler(async (req, res) => {
  // 1. Extract user details from the request body
  const { email, username, password } = req.body;

  // 2. Validate that either username or email is provided
  if (!username && !email) {
    throw new ApiError(400, "username or email error");
  }

  // 3. Find the user in the database using either username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    // 4. If the user is not found, throw an error
    throw new ApiError(404, "User not Found");
  }

  // 5. Check if the provided password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // 6. Generate access and refresh tokens for the user
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // 7. Fetch the logged-in user and exclude password and refreshToken fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8. Define cookie options to enhance security
  const options = {
    httpOnly: true, // Security Against XSS (Cross-Site Scripting) Attacks
    secure: true, // Protection Against Man-in-the-Middle (MitM) Attacks
  };

  // 9. Send a success response with the user data and set cookies for access and refresh tokens
  return res
    .status(200) // Set the response status to 200 (OK)
    .cookie("accessToken", accessToken, options) // Set accessToken cookie
    .cookie("refreshToken", refreshToken, options) // Set refreshToken cookie
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken, // Include accessToken in response if user wants to save it manually
          refreshToken,
        },
        "User logged in successfully (cookies)"
      )
    );
});

// Function to handle user logout
const logoutUser = asyncHandler(async (req, res) => {
  // 1. Update the user in the database:
  // Find the user by their ID and set their refreshToken to undefined
  // This effectively logs out the user by removing their refresh token from the database
  await User.findByIdAndUpdate(
    req.user._id, // The ID of the user to update
    {
      $set: {
        refreshToken: undefined, // Remove the refresh token from the user document
      },
    },
    {
      new: true, // This option returns the updated document
    }
  );

  // 2. Define cookie options to enhance security
  const options = {
    httpOnly: true, // The cookie cannot be accessed by client-side JavaScript
    secure: true, // The cookie will only be sent over HTTPS
  };

  // 3. Clear cookies and send a response confirming the logout
  return res
    .status(200) // Set the response status to 200 (OK)
    .clearCookie("accessToken", options) // Clear accessToken cookie
    .clearCookie("refreshToken", options) // Clear refreshToken cookie
    .json(new ApiResponse(200, {}, "User logged out")); // Send a JSON response confirming the logout
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Get the incoming refresh token from either the cookies or the request body
    const incommingRefreshToken =
      req.cookie.refreshToken || req.body.refreshToken;

    // If no refresh token is provided, throw an unauthorized error
    if (!incommingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }

    // Verify the incoming refresh token using the secret stored in environment variables
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find the user associated with the decoded token's user ID (_id)
    const user = await User.findById(decodedToken?._id);

    // If no user is found, throw an invalid token error
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    // Check if the incoming refresh token matches the one stored in the user's record
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    // Define options for setting cookies to ensure they are secure and HTTP-only
    const options = {
      httpOnly: true, // Prevents client-side access to the cookie via JavaScript
      secure: true, // Ensures the cookie is only sent over HTTPS
    };

    // Generate new access and refresh tokens for the user
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // Set the new tokens in cookies and respond with a success message and the new tokens
    return res
      .status(200) // Send an HTTP 200 OK status
      .cookie("accessToken", accessToken, options) // Set the new access token in the cookie
      .cookie("refreshToken", newRefreshToken, options) // Set the new refresh token in the cookie
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken }, // Include the new tokens in the response
          "Access token refreshed" // Success message
        )
      );
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error during token refresh (catch block)", error);
    // Rethrow the error to be handled by the global error handler
    throw error;
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  console.log(req.body);
  // Extract old and new passwords from the request body
  const { oldPassword, newPassword } = req.body;

  // Find the user in the database using their ID stored in req.user (populated by middleware)
  const user = await User.findById(req.user?._id);

  // Check if the old password provided by the user matches the one in the database
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  // If the old password is incorrect, throw an error
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  // If the old password is correct, set the new password
  user.password = newPassword;

  // Save the user with the new password, skipping validation checks
  await user.save({ validateBeforeSave: false });

  // Send a success response to the client
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// This function handles fetching the current user's information.
const getCurrentUser = asyncHandler(async (req, res) => {
  // Send the current user information stored in req.user as a response
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// This function updates the user's account details like fullname and email.
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  // Ensure both fullname and email are provided in the request
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the user by ID and update their fullname and email, returning the updated user
  const user = await User.findByIdAndUpdate(
    req.body?._id, // Assuming the user's ID is sent in the request body
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true } // Return the updated user document
  ).select("-password"); // Exclude the password from the returned user object

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// This function updates the user's avatar image.
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; // Get the file path of the uploaded avatar image

  // Ensure an avatar file was uploaded
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload the avatar to Cloudinary or another cloud storage service
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // Ensure the avatar was uploaded successfully
  if (!avatar.url) {
    throw new ApiError(400, "Error while updating avatar");
  }

  // Update the user's avatar URL in the database
  const user = await User.findOneAndUpdate(
    req.user?._id, // The user's ID is assumed to be available in req.user._id
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true } // Return the updated user document
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

// This function updates the user's cover image.
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path; // Get the file path of the uploaded cover image

  // Ensure a cover image file was uploaded
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // Upload the cover image to Cloudinary or another cloud storage service
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Ensure the cover image was uploaded successfully
  if (!coverImage.url) {
    throw new ApiError(400, "Error while updating cover image");
  }

  // Update the user's cover image URL in the database
  const user = await User.findOneAndUpdate(
    req.user?._id, // The user's ID is assumed to be available in req.user._id
    {
      $set: {
        coverImage: coverImage.url, // Set the coverImage URL in the user document
      },
    },
    { new: true } // Return the updated user document
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// Export the functions to be used in other parts of the application
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};
