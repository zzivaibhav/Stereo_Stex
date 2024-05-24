import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GenAc_Ref } from "../utils/AccessAndRefreshToken.js";
import jwt from "jsonwebtoken";
import { DeleteCloudinaryImage } from "../utils/DeleteCloudinaryImage.js";
import mongoose from "mongoose";
const registerUser = asyncHandler(async (req, res) => {
  // get user details from front end
  const { fullName, email, userName, password } = req.body;

  // validation - not empty
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === " ")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check is user already exists : username and email
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username alreay exist");
  }

  // check for images , check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required.");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required.");
  }
  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ",
    email: email.toLowerCase(),
    password,
    userName: userName.toLowerCase(),
  });
  // remove password and refresh_token field from response.

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // .select() is used to remove sepecific fields from the database payload.
  // check for user creation
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering the user !"
    );
  }
  // return response --> else --> send error

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully "));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body  --> data
  const { email, userName, password } = req.body;
  // username / email --> check
  if (!userName && !email) {
    throw new ApiError(400, "Username or password is required.");
  }
  //find the user
  const user = await User.findOne({ $or: [{ email }, { userName }] });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // compare password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //access and refresh token generate.
  const { accesstoken, refreshtoken } = await GenAc_Ref(user._id);
  // send secure cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true, //made it secure so that no one from the front-end can access the cookies.
  };
  return res
    .status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("refreshToken", refreshtoken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accesstoken,
          refreshtoken,
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToke = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToke) {
    throw new ApiError(401, "Unauthorised request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToke,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToke !== user?.refreshToken) {
      throw new ApiError(401, "Expired or used refresh token.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { refreshtoken, accesstoken } = await GenAc_Ref(user._id);
    return res
      .status(200)
      .cookie("accessToken", accesstoken, options)
      .cookie("refreshToken", refreshtoken, options)
      .json(
        new ApiResponse(
          200,
          {
            accesstoken,
            refreshtoken: refreshtoken,
          },
          "Access token refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password.");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password successfully changed."));
});

const getCurretUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched succesfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }
  const avatarNew = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        avatar: avatarNew.url,
      },
    },

    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "Cover image file is missing.");
  }
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        coverImage: coverImage.url,
      },
    },

    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "username is missing.");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo",
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully.")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "$watchHistory",
        foreignField: "$_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "$owner",
              foreignField: "$_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully."
      )
    );
});
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurretUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
