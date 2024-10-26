const express = require('express')
const router = express.Router();
const TypesProductController = require('../Controller/TypesProductController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.get('/get/typesfromtable', TypesProductController.getAllTypes);



module.exports = router