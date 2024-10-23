const express = require('express')
const router = express.Router();
const ResetPasswordController = require('../Controller/ResetPasswordController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/forgotpassword',ResetPasswordController.forgotPassword);
router.post('/resetpassword/:token',ResetPasswordController.resetPassword);

module.exports = router