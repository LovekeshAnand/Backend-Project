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


//CONTROLLER TO PUBLISH A VIDEO
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title or description is missing!");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is missing!");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing!");
    }

    // console.log(videoLocalPath);
    // console.log(thumbnailLocalPath);
    
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Error while uploading video or thumbnail to Cloudinary!");
    }

    const videoUrl = videoFile.url;
    const thumbnailUrl = thumbnail.url;
    // console.log(videoUrl)
    // console.log(thumbnailUrl)

    const videoId = videoUrl.split("/").pop().split(".")[0];
    const thumbnailId = thumbnailUrl.split("/").pop().split(".")[0];

    const video = await Video.create({
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        cloudinaryVideoId: videoId,
        cloudinaryThumbnailId: thumbnailId,
        title,
        description,
        duration: videoFile?.duration,
        owner: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video published successfully!"));
});
//this controller is working properly


//CONTROLLER TO FETCH VIDEO BY VIDEO ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully!"))

})
//this controller is working properly


//CONTROLLER TO UPDATE VIDEO DETAILS BY VIDEO ID
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params


    const video = await Video.findById(videoId)
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You can only update videos publsihed by you!");
    }

    const { title, description } = req.body;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID!")
    }

    const oldThumbnail = await video.cloudinaryThumbnailId
    await deleteFromCloudinary(oldThumbnail, "image")

    if (!title || !description) {
        throw new ApiError(400, "Title or description is missing!")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing!")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    const thumbnailUrl = thumbnail.url

    if (!thumbnailUrl) {
        throw new ApiError(400, "Error while uploading the thumbanil")
    }

    const thumbnailId = thumbnailUrl.split("/").pop().split(".")[0];

    const newVideoDetails =  await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url,
                cloudinaryThumbnailId: thumbnailId
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, newVideoDetails, "Video details updated sucessfully!"))

})
//this controller is working properly


//CONTROLLER TO DELETE THE VIDEO FROM CLOUDINARY AND DB
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID is not valid!");
    }

    // Find the video in the database
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    const deleteVideoFile = await deleteFromCloudinary(video.cloudinaryVideoId, "video")
    const deleteThumbnail = await deleteFromCloudinary(video.cloudinaryThumbnailId, "image")
    if (!(deleteVideoFile || deleteThumbnail)) {
        throw new ApiError(400, "Failed to delete thumbnail or video from cloudinary")
    }

    // Delete video from the database
    await Video.findByIdAndDelete(videoId);

    // Respond to the client
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Video deleted successfully!"));
});
//this controller is working properly


//CONTROLLER TO CHANGE THE PUBLISH STATUS
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {publishStatus} = req.body

    if (!videoId) {
        throw new ApiError(400, "Video Id is missing!")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is not valid!")
    }


    const video = await Video.findById(videoId)
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only the owner is allowed to unpublish the video!");
    }

    const updatePublishStatus = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set: {
                isPublished: publishStatus
            }
        },
        {
            new: true
        }
    )    

    return res
    .status(200)
    .json(new ApiResponse(200, updatePublishStatus, "Publish status updated successfully!"))


})
//this controller is working properly


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}