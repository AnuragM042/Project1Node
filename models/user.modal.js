import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"; // bearer token(key)
import bcrypt from "bcrypt"; // for encrypt and decrypt

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // helps in searching but can lag the db with space
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trime: true,
    },
    fullname: {
      type: String,
      required: true,
      // unique: true,
      // lowercase: true,
      trime: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      // indicates an array (multiple items)
      {
        // indicates an object
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// pre is a hook
// dont use arrow function as there is no "this" context
// use async as we are connecting to db and next for passing flag forward
//
// Pre-save hook for the User model
userSchema.pre("save", async function (next) {
  // If the password field hasn't been modified, skip this middleware
  if (!this.isModified("password")) return next();

  // If the password field has been modified, hash the new password before saving it
  this.password = await bcrypt.hash(this.password, 10); // 10 salt rounds

  // Proceed to the next middleware or save the document
  next();
});

// Method to check if the provided password matches the hashed password in the database
userSchema.methods.isPasswordCorrect = async function (password) {
  // Compare the provided password with the stored hashed password
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    // to generate a token
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCES_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCES_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    // to generate a token
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
