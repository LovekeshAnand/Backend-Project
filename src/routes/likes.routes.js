import {Router} from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos } from '../controllers/like.controller.js'
import { getAllVideos } from '../controllers/video.controller.js'
const router = Router()

router.route("/like-video/:videoId").post(verifyJWT, toggleVideoLike) 
router.route("/like-comment/:commentId").post(verifyJWT, toggleCommentLike)
router.route("/like-tweet/:tweetId").post(verifyJWT, toggleTweetLike)
router.route("/all-liked-videos").get(verifyJWT, getLikedVideos)

export default router