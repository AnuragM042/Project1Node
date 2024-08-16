import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises"; // Use the promise-based version of fs

// Configuration for Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
   //  console.log("File has been uploaded to Cloudinary", response.url);
   fs.unlink(localFilePath)
    return response;

  } catch (error) {
    console.error("Error during Cloudinary upload:", error);

    // Remove the locally saved temporary file as the operation failed
    try {
      await fs.unlink(localFilePath);
      console.log("Local file deleted successfully");
    } catch (unlinkError) {
      console.error("Failed to delete local file:", unlinkError);
    }

    return null;
  }
};

export { uploadOnCloudinary };










// import cloudinary from 'cloudinary'; // Ensure this is properly configured
// import fs from 'fs/promises'; // Use the promise-based version of fs

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;

//     // Upload the file to Cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });

//     // File has been uploaded successfully
//     console.log("File has been uploaded to Cloudinary", response.url);
//     return response;

//   } catch (error) {
//     console.error("Error during Cloudinary upload:", error);

//     // Remove the locally saved temporary file as the operation failed
//     try {
//       await fs.unlink(localFilePath);
//       console.log("Local file deleted successfully");
//     } catch (unlinkError) {
//       console.error("Failed to delete local file:", unlinkError);
//     }

//     return null;
//   }
// };

// export { uploadOnCloudinary };

