import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/publish-video").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo);


router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/update-video/:videoId").patch(verifyJWT,
    upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    }
    ]), 
    updateVideo);
router.route("/get-video/:videoId").get(verifyJWT, getVideoById);
router.route("/publish-status/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/get-videos").get(verifyJWT, getAllVideos)
export default router