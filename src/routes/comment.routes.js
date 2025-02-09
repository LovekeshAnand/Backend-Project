import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from '../controllers/comment.controller.js'


const router = Router()

router.route("/comment/:videoId").post(verifyJWT, addComment)
router.route("/update-comment/:commentId").patch(verifyJWT, updateComment)
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment)
router.route("/video-comments/:videoId").get(verifyJWT, getVideoComments)
export default router