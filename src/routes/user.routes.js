import { Router } from "express";
import {
  changeCurrentPassword,
  getCurretUser,
  getUserChannelProfile,
  getWatchHistory,
  logOutUser,
  loginUser,
  refreshAcessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1, // how many files will be accepted ?
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), //this is middleware that's why it is written in the middle.
  registerUser
);
router.route("/login").post(loginUser);

//secured routes.
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAcessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurretUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/update-coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route(`/userChannel/:userName`).get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);
export default router;
