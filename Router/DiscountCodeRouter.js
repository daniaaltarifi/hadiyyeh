const express = require('express')
const router = express.Router();
const DiscountCodeController = require('../Controller/DiscountCodeController.js')
const bodyParser=require("body-parser")
const app=express();
app.use(express.json());
app.use(bodyParser.json()); 

router.post('/validatecode', DiscountCodeController.validateDiscountCode);
router.get('/getcodes', DiscountCodeController.getDiscountCode);
router.post('/addcode', DiscountCodeController.addDiscountCode);
router.delete('/deletecode/:id', DiscountCodeController.deletedCode);




module.exports = router