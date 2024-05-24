import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, getVideoDuration } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const publishVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    // video local path
    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!videoLocalPath || !thumbnailLocalPath) {
      throw new ApiError(400, "Video and thumbnail both are required.");
    }
    // Upload video and thumbnail to Cloudinary
    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath); // Assuming thumbnail is an image

    // Retrieve video duration
    const duration = await getVideoDuration(video.public_id);

    // Create new video document in the database
    const videoUploaded = await Video.create({
      videoFile: video.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration,
      isPublished: true,
    });

    res
      .status(200)
      .json(new ApiResponse(200, videoUploaded, "Video uploaded Successfully"));
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json(
        new ApiError(400, "Error while uploading the video on the server.")
      );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "Video not found.");
    }
    if (video.isPublished) {
      video.isPublished = false;
    } else {
      video.isPublished = true;
    }
    await video.save({ validateBeforeSave: false }); // this will stop other models from kicking in .
    return res
      .status(200)
      .json(
        new ApiResponse(200, video, "Successfully toggled publishing status.")
      );
  } catch (error) {
    throw new ApiError(
      401,
      "Something went wrong while updating the publishing status."
    );
  }
});
export { publishVideo, togglePublishStatus };
