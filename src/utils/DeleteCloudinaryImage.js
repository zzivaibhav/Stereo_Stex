import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError";

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
    const response = await cloudinary.uploader.destroy(onlineFilePath);
    //file has been deleted successfully
    //console.log("File is uploaded on cloudinary: ", response.url);

    return response;
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while deleting the file on Cloudinary Server...."
    );
  }
};

export { DeleteCloudinaryImage };
