import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})


//CONTROLLER TO ADD A COMMENT ON A VIDEO BY GETTING VIDEO ID THROUGH PARAMS
const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const userId = req.user._id
    const {content} = req.body

    if (!videoId) {
        throw new ApiError(404, "Video id is missing from params!")
    }

    if (!userId) {
        throw new ApiError(404, "User id is missing from!")
    }

    if (!content) {
        throw new ApiError(400, "Content is missing!")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is invalid!")
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User Id is invalid!")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully!"))
})
//this controller is working properly


//CONTROLLER TO UPDATE THE COMMENT BY GETTING COMMENT ID THROUGH PARAMS
const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {updatedContent} = req.body

    if (!commentId) {
        throw new ApiError(404, "Content Id is missing from params!")
    }
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment Id is invalid!")
    }

    if (!updatedContent) {
        throw new ApiError(404, "Updated content is missing!")
    }
    
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found!")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner of comment is allowed to make changes.")
    }

    const updatedComment =  await Comment.findByIdAndUpdate(
        commentId, {
            $set: {content: updatedContent}
        },
        {
            new: true
        }
    )

   
    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully!"))

})
//this controller is working properly


//CONTROLLER TO DELETE COMMENT BY GETTING COMMENT ID THROUGH PARAMS
const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if (!commentId) {
        throw new ApiError(404, "Content Id is missing from params!")
    }
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment Id is invalid!")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found!")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comments.")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if (!deletedComment) {
        throw new ApiError(500, "Error while deleting the comment!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted sucessfully!"))
})
//this controller is working properly


export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }