const express = require("express");
const router = express.Router();
const GiftCardController = require("../Controller/GiftCardController.js");
const multer = require("../../Config/Multer.js");


router.post('/add', multer.fields([{ name: "img", maxCount: 1 }]),GiftCardController.addGiftCard)
router.get('/',GiftCardController.getGiftCard)
router.get('/:id',GiftCardController.getGiftCardById)
router.put('/update/:id', multer.fields([{ name: "img", maxCount: 1 }]),GiftCardController.updateGiftCard)
router.delete('/delete/:id',GiftCardController.deleteGiftCard)
module.exports = router;

