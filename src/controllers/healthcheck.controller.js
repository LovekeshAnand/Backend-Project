import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//CONTROLLER TO CHECK IF THE ROUTES ARE WORKING PROPERLY OR NOT
const healthcheck = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, "Routes are working properly!"))
})
//this controller is working properly

export {
    healthcheck
    }
    