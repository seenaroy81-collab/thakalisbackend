import express from 'express';
import { userSignup, userLogin, updateDetails, getUserDetails, deleteUserDetails, requestOTP, verifyOTP } from '../controller/userController.js';
import { getAllUserDetails, getStoresDetails } from '../controller/adminController.js'
import protect from '../middleWare/userMiddleWare.js'

const app = express.Router()

app.route('/').post(requestOTP).get(getAllUserDetails)
app.route('/getUser').get(protect, getUserDetails)
app.route('/login').post(userLogin)
app.route('/request-otp').post(requestOTP)
app.route('/verify-otp').post(verifyOTP)
app.route('/stores').get(getStoresDetails)
app.route("/:id").put(protect, updateDetails).delete(deleteUserDetails)

export default app