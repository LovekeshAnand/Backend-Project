import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


//CONTROLLER TO TOGGLE SUBSCRIPTION 
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const { isSubscribed } = req.query
    const userId = req.user._id

    if (typeof JSON.parse(isSubscribed) !== "boolean") {
        throw new ApiError(400, "Only boolean data is accepted!")
    }

    const existingSubscribe = await Subscription.findOne({channel: channelId, subscriber: userId})

    if(isSubscribed){
        if (!existingSubscribe) {
            await Subscription.create({
                channel: channelId,
                subscriber: req.user._id
            })
            return res
            .status(200)
            .json(new ApiResponse(200, "Channel subscribed successfully!")) 
        }
        return res
        .status(200)
        .json(new ApiResponse(200, existingSubscribe, "This Channel is already subscribed by you!"))
    } else {
        if (existingSubscribe) {
            await Subscription.findOneAndDelete({ channel: channelId, subscriber: req.user._id });
            return res.status(200).json(new ApiResponse(200, "Channel unsubscribed successfully!"));
        }
        return res.status(200).json(new ApiResponse(200, "You haven't subscribed this channel yet!."));
    }
})
//this controller is working properly


//CONTROLLER TO FETCH SUBSCRIBER OF A CHANNEL
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid channel ID"));
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                subscriberId: "$subscriber",
                fullname: "$subscriberDetails.fullname",
                username: "$subscriberDetails.username"
            }
        }
    ]);

    if (subscriberList.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "No subscribers found"));
    }

    return res.status(200).json(new ApiResponse(200, subscriberList, "Subscriber list fetched successfully!"));
});
//this controller is working properly


//CONTROLLER TO FETCH SUBSCRIBED CHANNELS
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        }
    ])

    if (channelList.length === 0) {
        return res.status(404).json(new ApiResponse(404, null, "You are not subscribed to any channel!"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channelList, "Channel list fetched successfully!"))
})
//this controller is working properly


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}