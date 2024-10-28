
const express = require('express')
const router = express.Router();

const FragranceTypeIdController = require('../Controller/FragranceTypeIdController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 


router.get('/getfragrancetypeid', FragranceTypeIdController.getfragrancetypes);



module.exports = router