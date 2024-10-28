
const express = require('express')
const router = express.Router();

const ProductTypeIdController = require('../Controller/ProductTypeIdController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 


router.get('/getwatchtypeid', ProductTypeIdController.getwatchtype);





module.exports = router