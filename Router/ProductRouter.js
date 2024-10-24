const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const BrandController = require("../Controller/BrandController.js");
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
router.post("/add", upload.array("img", 5), ProductController.addProduct);
// router.post('/add', upload.fields([{ name: 'brand_img', maxCount: 1 },{ name: 'img', maxCount: 5 } ]), ProductController.addProduct);

router.get("/:id", ProductController.getProductDetails);
router.get("/bymaintype/:main_product_type", ProductController.getProducts);
router.get("/bysubtype/subtype", ProductController.getProductBysubType);
router.delete("/delete/:id", ProductController.deleteProduct);

//  BRAND CONTROLLER
router.post(
  "/addbrand",
  upload.fields([{ name: "brand_img", maxCount: 1 }]),
  BrandController.addBrand
);
router.get("/get/brands", BrandController.getAllBrands);
router.get(
  "/get/productbybrands/:brand",
  BrandController.getProductBasedOnBrands
);
router.put("/updatebrand/:id",upload.fields([{ name: "brand_img", maxCount: 1 }]),BrandController.updateBrand);
router.get("/get/brandsbyid/:id", BrandController.getBrandByid);
router.delete("/delete/brand/:id", BrandController.deleteBrand);

  // GET SIZES
router.get("/get/sizesbags", BrandController.sizesBags);
router.get("/get/sizesfragrances", BrandController.sizesFragrance);
  // GET SEASONS
router.get("/get/season", BrandController.getSeasons);
router.get("/get/productbyseason/:season", BrandController.getProductBySeasons);
//GET AllPRODUCT

router.get("/get/allproducts",BrandController.getAllProducts)
router.get("/get/latestproducts",BrandController.getLatestProduct)
module.exports = router;
