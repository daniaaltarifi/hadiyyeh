const express = require("express");
const router = express.Router();
const WrapGiftController = require("../Controller/WrapGiftController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const customStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); // Destination folder
  },
  filename: (req, file, cb) => {
    // Generate the filename
    const filename = file.originalname;
    const filePath = path.join("images", filename);

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
      // If file exists, return the existing filename
      cb(null, filename);
    } else {
      // If file doesn't exist, save it with the given filename
      cb(null, filename);
    }
  },
});

// Middleware to handle file upload
const upload = multer({
  storage: customStorage,
  fileFilter: (req, file, cb) => {
    // Optionally, you can filter file types if needed
    cb(null, true);
  },
});
router.post('/add', upload.fields([{ name: "img", maxCount: 1 }]),WrapGiftController.addWrapGift)
router.get('/',WrapGiftController.getWrapGift)
router.get('/wrapgiftbyid/:id',WrapGiftController.getWrapGiftById)
router.put('/update/:id', upload.fields([{ name: "img", maxCount: 1 }]),WrapGiftController.updateWrapGift)
router.delete('/delete/:id',WrapGiftController.deleteWrapGift)
module.exports = router;

