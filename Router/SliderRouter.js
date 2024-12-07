const express = require("express");
const router = express.Router();
const SliderController = require("../Controller/SliderController.js");
const multer = require("../../Config/Multer.js");



router.post('/add', multer.fields([{ name: "img", maxCount: 1 }]),SliderController.addslider)
router.get('/',SliderController.getslider)
router.get('/getbyid/:id',SliderController.getSliderById)
router.put('/update/:id', multer.fields([{ name: "img", maxCount: 1 }]),SliderController.updateslider)
router.delete('/delete/:id',SliderController.deleteslider)
module.exports = router;

