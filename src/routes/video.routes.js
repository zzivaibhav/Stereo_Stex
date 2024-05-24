import { Router } from "express";
import {
  publishVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/publishVideo").post(
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route(`/togglePublishStatus/:videoId`).patch(togglePublishStatus);
export default router;
