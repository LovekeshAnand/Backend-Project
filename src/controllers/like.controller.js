import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


//CONTROLLER TO TOGGLE LIKE ON A VIDEO
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const { isLiked } = req.body
    const userId = req.user._id

    if (typeof isLiked !== "boolean") {
        throw new ApiError(400, "Only boolean data is accepted!")
    }

    const existingLike = await Like.findOne({video: videoId, likedBy: userId})

    if(isLiked){
        if (!existingLike) {
            await Like.create({
                video: videoId,
                likedBy: req.user._id
            })
            return res
            .status(200)
            .json(new ApiResponse(200, "Like added successfully!")) 
        }
        return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "This video is already liked by you!"))
    } else {
        if (existingLike) {
            await Like.findOneAndDelete({ video: videoId, likedBy: userId });
            return res.status(200).json(new ApiResponse(200, "unliked", "Like removed successfully!"));
        }
        return res.status(200).json(new ApiResponse(200, "not liked", "You haven't liked this video yet."));
    }
})
//this controller is working properly


//CONTROLLER TO TOGGLE LIKE ON A COMMENT
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { isLiked } = req.body;
    const userId = req.user._id;

    if (typeof isLiked !== "boolean") {
        throw new ApiError(400, "Only boolean data is accepted!");
    }

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (isLiked) {
        if (!existingLike) {
            await Like.create({ comment: commentId, likedBy: userId });
            return res.status(200).json(new ApiResponse(200, "liked", "Like added successfully!"));
        }
        return res.status(200).json(new ApiResponse(200, "already liked", "You have already liked this comment!"));
    } else {
        if (existingLike) {
            await Like.findOneAndDelete({ comment: commentId, likedBy: userId });
            return res.status(200).json(new ApiResponse(200, "unliked", "Like removed successfully!"));
        }
        return res.status(200).json(new ApiResponse(200, "not liked", "You haven't liked this comment yet."));
    }
});
//this controller is working properly


//CONTROLLER YO TOGGLE LIKE ON A TWEET
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const { isLiked } = req.body;
    const userId = req.user._id;

    if (typeof isLiked !== "boolean") {
        throw new ApiError(400, "Only boolean data is accepted!");
    }

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (isLiked) {
        if (!existingLike) {
            await Like.create({ tweet: tweetId, likedBy: userId });
            return res.status(200).json(new ApiResponse(200, "liked", "Like added successfully!"));
        }
        return res.status(200).json(new ApiResponse(200, "already liked", "You have already liked this comment!"));
    } else {
        if (existingLike) {
            await Like.findOneAndDelete({ tweet: tweetId, likedBy: userId });
            return res.status(200).json(new ApiResponse(200, "unliked", "Like removed successfully!"));
        }
        return res.status(200).json(new ApiResponse(200, "not liked", "You haven't liked this tweet yet."));
    }
}
)
//this controller is working properly


//CONTROLLER TO FETCH ALL LIKED VIDEOS OF A USER
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        { 
            $match:{likedBy:new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup: {
                from: "videos",       
                localField: "video",  
                foreignField: "_id",  
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                videoId: "$videoDetails._id",
                title: "$videoDetails.title",
                thumbnail: "$videoDetails.thumbnail",
                description: "$videoDetails.description",
                createdAt: "$videoDetails.createdAt"
            }
        }    
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully!"))


})
//this controller is working properly


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}