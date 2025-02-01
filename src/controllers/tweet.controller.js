import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


//CONTROLLER TO CREATE A NEW TWEET
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {tweet} = req.body
    const userId = req.user._id

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User Id is invalid!")
    }
    if (!tweet) {
        throw new ApiError(400, "Tweet is missing!")
    }

    const newTweet = await Tweet.create({
        content: tweet,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "New tweet created successfully!"))
})
//this controller is working properly


//CONTROLLER TO FETCH ALL THE TWEETS MADE BY USER
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if (!userId) {
        throw new ApiError(404, "User Id is missing!")
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User Id is invalid!")
    }

    const tweets = await Tweet.find({owner: userId})
    if (tweets.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No tweets found for this user!"));
    }
    

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully!"))
})
//this controller is working properly


//CONTROLLER TO UPDATE THE TWEET BY GETTING TWEET ID FROM PARAMS
const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if (!tweetId) {
        throw new ApiError(400, "Tweet Id is missing from params!")
    }
    if (!content) {
        throw new ApiError(400, "Tweet cannot be empty!")
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet Id is invalid!")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found!")
    }
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only the owner is allowed to update the tweet!");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        }, 
        {
            new: true
        }
    )

    if (!updatedTweet) {
        throw new ApiError(400, "Error while updating the tweet, please try again later!")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully!"))
})
//this controller is working properly


//CONTROLLER TO DELETE THE TWEET BY GETTING TWEET ID FROM PARAMS
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if (!tweetId) {
        throw new ApiError(400, "Tweet Id is missing!")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet id is invalid!")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found!")
    }
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only the owner is allowed to delete the tweet!")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if (!deletedTweet) {
        throw new ApiError(500, "Error while deleting the tweet, please try again later!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully!"))
})
//this controller is working properly


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}