import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAcessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token.")
  }
}


//WRTTING CONTROLLER TO REGISTER USER
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend 
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // uplaod them to cloudinary, avatar
    // create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return response


    //if the data is coming directly from a form or a json response we can get it thorugh req.body and if the data is coming through a URL we will study later about it .
    // GET USER DETAILS FROM FRONTEND
    const {username, email, fullname, password} = req.body
    //console.log("email: ", email);

    // VALIDATION - NOT EMPTY
    // if(fullname === ""){
    //   throw new ApiError(400, "Full name is required")
    // }
    
    if(
      [fullname, email, username, password].some((field) => 
      field?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required")
    } 
    //console.log(req.body)
    //console.log(req.files)

    // CHECK IF USER ALREADY EXISTS: USERNAME, EMAIL
    const existedUser = await User.findOne({
      $or: [{username}, {email}] //this is the syntax to find multiple fields using .findOne
    })
    if(existedUser){
      throw new ApiError(409, "User with email or username already exists")
    }


    // CHECK FOR IMAGES, CHECK FOR AVATAR
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
    }


    // UPLOAD THEM ON CLOUDINARY
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
      throw new ApiError(400, "Avatar is required")
    }
    

    // CREATE USER OBJECT - CREATE ENTRY IN DB
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken" //this is used to deselect the fields which are not required while requesting the data from the user
    ) 
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
    }
    //to check if the user is created or not in DB


    //RETURN RESPONSE 
    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    )
} )


//WRITTING CONTROLLER TO LOGIN USER
const loginUser = asyncHandler( async (req, res) => {
  // request data from the body
  // validate on username or email basis
  // find the user 
  // password check
  // access and refresh token generation
  // send cookies 



  //REQUESTING DATA FROM THE BODY
  const {email, password, username} = req.body

  //CHECKING IF USER ENTERED THE USERNAME OR EMAIL
  if (!username && !email) {
    throw new ApiError(400, "username or email is required")
}

// Here is an alternative of above code based on logic discussed in video:
// if (!(username || email)) {
//     throw new ApiError(400, "username or email is required")
    
// }


  //FINDING THE EXISITING USER IN DATABASE
  const user = await User.findOne({
    $or: [{username}, {email}] //$or: [{}, {}] this is a mongoDB operator 
  })

  if (!user) {
    throw new ApiError(404, "User does not exist!")
  }

  //USING OUR OWN METHOD TO CHECK IF THE PASSWORD ENTERED BY USER IS CORRECT OR NOT
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials!")
  }


  //GENERATING ACCESS AND REFRESH TOKEN THROUGH OUR OWN METHOD
  const {accessToken, refreshToken} = await generateAcessAndRefreshTokens(user._id)

  //SEGREGATING UNWANTED FIELDS BEFORE SENDING RESPONSE TO THE USER
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  
  //CONFIGURING COOKIES
  const options = {
    httpOnly: true,
    secure: true
  }
 

  //SENDING COOKIES IN RESPONSE AS WELL AS STATUS CODE AND JSON RESPONSE
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully!")
  )

})


//WRITTING CONTROLLER TO LOGIUT USER
const logoutUser = asyncHandler( async (req, res) => {
  //remove cookies 
  //remove refresh token from DB

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true //here we are making a new field in the DB entry of the particular user.
    }
  )
 
  //CONFIGURING COOKIES
  const options = {
    httpOnly: true,
    secure: true
  }

  //SENDING RESPONSE WITH STATUSCODE AND CLEARING COOKIES AS USER LOGOUT
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refershToken", options)
  .json(new ApiResponse(200, {}, "User logged out successfully!"))
})


//REFRESHING USER ACCESS TOKEN USING REFRESH TOKEN
const refreshAccessToken = asyncHandler( async(req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //getting token from cookies

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request!!")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET) //decoding token
  
    const user = await User.findById(decodedToken?._id) //getting user id from decoded token and using mongoDb query to access it
  
    if (!user) {
      throw new ApiError(401, "invalid refresh token!")
    }
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!") //matching the already saved refresh token and the refresh token sent by the user
    }  
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newRefreshToken} = await generateAcessAndRefreshTokens(user._id) //generating new access and refresh token
  
  
    //SENDING RESPONSE WITH NEW REFRESH AND ACCESS TOKEN ALONG WITH STATUS CODE AND SUCCESS MESSAGE
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed")
    )
    
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request!!")
  }
})


//WRITTING CONTROLLER TO CHANGE THE OLD PASSWORD WITH NEW ONE
const changeCurrentPassword = asyncHandler( async(req, res) => {
  const {oldPassword, newPassword} = req.body //can also include confirm password field, i have removed it from here.

  // if (!(newPassword === confPassword)) {
  //   throw new ApiError(400, "New password is not confirmed!") Comparing new password with confirm password
  // }

  const user = await User.findById(req.user?._idid)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password!")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})


  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully!"))

})


//WRITTING CONTROLLER TO FETCH CURRENT USER
const getCurrentUser = asyncHandler( async(req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "Current user fetced successfully!"))
})


//WRITTING CONTROLLER TO UPDATE ACCOUNT DETAILS
const updateAccountDetails = asyncHandler( async(req, res) => {
  const {fullname, email} = req.body

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required!")
  }

  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname, //we can also write it like fullname: fullname and same for email
        email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully!"))
})


//WRITTING CONTROLLER TO UPDATE USER AVATAR
const updateUserAvatar = asyncHandler(async(req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing!")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar!")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Avatar image updated successfully!"))
})


//WRITTING CONTROLLER TO UPDATE USER COVER IMAGE
const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is file is missing!")
  }

  const coverImage = uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading the cover image!")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse("Cover image updated successfully"))
})

//WRITTING CONTROLLER TO FETCH USER CHANNEL DETAILS LIKE SUBSCIBERS AND SUBSCRIBED TO USING AGGREGATION PIPELINES
const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params //here we requested the username from the url of the current route

  if (!username?.trim()) {
    throw new ApiError(400, "Username not found!")
  }

  const channel = await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()  //matching username to verify 
      }
    },
    {
      $lookup:{
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      } //creating new field of subscribers by matching from subscription schema 
    },
    {
      $lookup:{
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      } //creating new field of the channels the user has subscribed to using subscription schema 
    },
    {
      $addFields:{
        subscribersCount: {
          $size: "subscribers"    //count of subscribers
        },
        channelsSubscribedToCount: {
          $size: "subscribedTo" //count of channels the user has subscribed to 
        },
        isSubscribed: {
          $cond:{
            if: {$in: [req.user?._id, "subscribers.subscriber"]},
            then: true,
            else: false
          }   //writting condition to find, if the user had already subscribed the channel or not
        }   
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      } //sending details of a user and channel 
    }
  ])

  if(!channel?.length){
    throw new ApiError(400, "Channel does not exist!")
  } //writting condition to check if there is a channel or not

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "User channel fetched successfully!"))
})


//WRITTING CONTROLLER TO FETCH USER WATCH HISTORY
const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id) //matching user id from the requested object id from the mongoose
      }
    },
    {
      $lookup: {   //getting watch history field from user through videos and adding it as watchHistory
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [  //adding sub pipeline 
          {
            $lookup: {  //getting owner of video from user through video and adding it as owner
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }  //sending owner details of the video in watch history
                }
              ]
            }
          },
          {
            $addFields:{
              owner: {
                $first: "$owner"
              }//overwritting the owner field in watchHistory
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully!"))
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}