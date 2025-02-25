import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, updateTweet, getUserTweets } from "../controllers/tweet.controller.js";

const router = Router();

router.route("/create-tweet").post(verifyJWT, createTweet)
router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet)
router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet)
router.route("/user-tweets/:userId").get(verifyJWT, getUserTweets)

export default router