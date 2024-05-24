import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DeleteCloudinaryImage = async (onlineFilePath) => {
  try {
    if (!onlineFilePath) return null;
    //delete the file on cloudinary
    await cloudinary.uploader.destroy(onlineFilePath);
    //file has been deleted successfully
    //console.log("File is uploaded on cloudinary: ", response.url);

    return resizeBy
      .status(200)
      .json(new ApiResponse(200, {}, "Old image Deleted"));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while deleting the file on Cloudinary Server...."
    );
  }
};

export { DeleteCloudinaryImage };
