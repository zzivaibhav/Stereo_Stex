import { Router } from "express";
import {
  logOutUser,
  loginUser,
  registerUser,
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
export default router;
