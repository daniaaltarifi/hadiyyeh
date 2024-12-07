const express = require("express");
const router = express.Router();
const WrapGiftController = require("../Controller/WrapGiftController");
const multer = require("../Config/Multer");


router.post('/add', multer.fields([{ name: "img", maxCount: 1 }]),WrapGiftController.addWrapGift)
router.get('/',WrapGiftController.getWrapGift)
router.get('/wrapgiftbyid/:id',WrapGiftController.getWrapGiftById)
router.put('/update/:id', multer.fields([{ name: "img", maxCount: 1 }]),WrapGiftController.updateWrapGift)
router.delete('/delete/:id',WrapGiftController.deleteWrapGift)
module.exports = router;

