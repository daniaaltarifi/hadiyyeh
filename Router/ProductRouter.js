const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const BrandController = require("../Controller/BrandController.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
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
      // If file exists, append a timestamp to the filename
      const timestamp = Date.now();
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      cb(null, `${baseName}-${timestamp}${ext}`);
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

// Product routes
router.post("/add", upload.array("img", 5), ProductController.addProduct);
router.get("/:id", ProductController.getProductDetails);
router.get("/bymaintype/:main_product_type", ProductController.getProducts);
router.get("/bysubtype/:subtype", ProductController.getProductBysubType);
router.delete("/delete/:id", ProductController.deleteProduct);
router.put("/update/:id", upload.array("img", 5), ProductController.updateProduct);

// Brand routes
router.post("/addbrand", upload.fields([{ name: "brand_img", maxCount: 1 }]), BrandController.addBrand);
router.get("/get/brands", BrandController.getAllBrands);
router.get("/get/productbybrands/:brand", BrandController.getProductBasedOnBrands);
router.put("/updatebrand/:id", upload.fields([{ name: "brand_img", maxCount: 1 }]), BrandController.updateBrand);
router.get("/get/brandsbyid/:id", BrandController.getBrandByid);
router.delete("/delete/brand/:id", BrandController.deleteBrand);

// Get sizes
router.get("/get/sizesbags", BrandController.sizesBags);
router.get("/get/sizesfragrances", BrandController.sizesFragrance);

// Get seasons
router.get("/get/season", BrandController.getSeasons);
router.get("/get/productbyseason/:season", BrandController.getProductBySeasons);

// Get all products
router.get("/get/allproducts", BrandController.getAllProducts);
router.get("/get/latestproducts", BrandController.getLatestProduct);

router.get("/getproductbyid/:id",ProductController.getProductById)
router.put('/updateFragranceVariants/:id', ProductController.updateFragranceVariant);
router.put("/updatebagsvariants/:id",ProductController.updateBagVariants)
router.get("/getfragrancevariantsbyid/:id",ProductController.getFragranceVariantsById)
router.get("/getbagsvariansbyid/:id", ProductController.getBagVariantsById)
router.delete('/deletefragrancevariant/:variantFragranceID', ProductController.deleteFragranceVariantByFragranceID);
router.delete("/deletebagsvariants/:VariantID", ProductController.deleteBagVariantByVariantID)
router.get("/variants/getAllProductsWithVariantsCMS",ProductController.getAllProductsWithVariantsCMS)
router.delete("/deleteProductImageById/:id", ProductController.deleteProductImage)


module.exports = router;
