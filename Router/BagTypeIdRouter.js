
const express = require('express')
const router = express.Router();

const BagTypeIdController = require('../Controller/BagTypeIdController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 


router.get('/getbagtypeid', BagTypeIdController.getbagtype);





module.exports = router