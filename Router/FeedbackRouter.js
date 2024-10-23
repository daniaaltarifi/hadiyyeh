const express = require('express')
const router = express.Router();
const FeedbackController = require('../Controller/FeedbackController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/add', FeedbackController.addFeedback);
 router.get('/getFeedback', FeedbackController.getFeedback)
//  router.put('/updateFeedback/:id', FeedbackController.updateFeedbackByuserID);
 router.delete('/deletefromFeedback/:id', FeedbackController.deleteFeedback);


module.exports = router