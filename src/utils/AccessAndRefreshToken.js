import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";
const GenAc_Ref = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();
    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false }); // this will stop other models from kicking in .
    return { accesstoken, refreshtoken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens."
    );
  }
};

export { GenAc_Ref };
