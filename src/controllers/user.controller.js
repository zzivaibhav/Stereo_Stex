import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
