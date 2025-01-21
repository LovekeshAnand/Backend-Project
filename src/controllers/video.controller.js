import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "title", sortType = "ascending", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})


//WRITTING A CONTROLLER TO PUBLISH A VIDEO
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "Title or description is missing!")
    }

    //requesting files to upload on cloudinary
    const videoLocalPath = req.files?.video?.[0]?.path; 
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is missing!")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing!")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Error while uploading video or thumbnail to Cloudinary!");
    }

    //saving video details in DB
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile?.duration,
        owner: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully!"))
})



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body
    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID!")
    }

    if (!title || !description) {
        throw new ApiResponse(400, "Title or description is missing!")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing!")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading the thumbanil")
    }

    const video =  await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated sucessfully!"))

})


//WRITTING CONTROLLER TO DELETE THE VIDEO FROM CLOUDINARY AND DB
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid!")
    }

    const video = await Video.findById({_id: videoId})

    if (!video) {
        throw new ApiError(404, "Video is not found!")
    }

    if (video.videoFile) {
        const deleteVideoFile = await deleteFromCloudinary(video.videoFile);
        if (!deleteVideoFile) {
            console.error(`Failed to delete video file from Cloudinary: ${video.videoFile}`);
        }
    }

    // Delete thumbnail from Cloudinary
    if (video.thumbnail) {
        const deleteThumbnail = await deleteFromCloudinary(video.thumbnail);
        if (!deleteThumbnail) {
            console.error(`Failed to delete thumbnail from Cloudinary: ${video.thumbnail}`);
        }
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully!"))
})



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}