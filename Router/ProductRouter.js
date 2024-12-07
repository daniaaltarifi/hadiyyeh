const express = require("express");
const router = express.Router();
const ProductController = require("../Controller/ProductController.js");
const BrandController = require("../Controller/BrandController.js");
const multer = require("../Config/Multer.js");



router.post("/add", multer.array("img", 5), ProductController.addProduct);
router.get("/:id", ProductController.getProductDetails);
router.get("/bymaintype/:main_product_type", ProductController.getProducts);
router.get("/bysubtype/:subtype", ProductController.getProductBysubType);
router.delete("/delete/:id", ProductController.deleteProduct);
router.put("/update/:id", multer.array("img", 5), ProductController.updateProduct);

// Brand routes
router.post("/addbrand", multer.fields([{ name: "brand_img", maxCount: 1 }]), BrandController.addBrand);
router.get("/get/brands", BrandController.getAllBrands);
router.get("/get/productbybrands/:brand", BrandController.getProductBasedOnBrands);
router.put("/updatebrand/:id", multer.fields([{ name: "brand_img", maxCount: 1 }]), BrandController.updateBrand);
router.get("/get/brandsbyid/:id", BrandController.getBrandByid);
router.delete("/delete/brand/:id", BrandController.deleteBrand);``

router.get("/variants/getAllProductsWithVariantsCMS",ProductController.getAllProductsWithVariantsCMS)
router.get("/variants/getProductByIdWithVariantsCMS/:id",ProductController.getProductByIdWithVariantsCMS)
router.get("/getProductDetailsDashboard/:id",ProductController.getProductDetailsDashboard)

// Get sizes
router.get("/get/sizesbags", BrandController.sizesBags);
router.get("/get/sizesfragrances", BrandController.sizesFragrance);

// Get seasons
router.get("/get/season", BrandController.getSeasons);
router.get("/get/productbyseason/:season", BrandController.getProductBySeasons);

// Get all products
router.get("/get/allproducts", BrandController.getAllProducts);
router.get("/getproductbyid/:id",ProductController.getProductById)
router.get("/get/latestproducts", BrandController.getLatestProduct);
router.get("/getproductsubtype/:type", ProductController.getProductBysubType);


//variants routes
router.put('/updateFragranceVariants/:id', ProductController.updateFragranceVariant);
router.put("/updatebagsvariants/:id",ProductController.updateBagVariants)
router.get("/getfragrancevariantsbyid/:id",ProductController.getFragranceVariantsById)
router.get("/getbagsvariansbyid/:id", ProductController.getBagVariantsById)
router.delete('/deletefragrancevariant/:variantFragranceID', ProductController.deleteFragranceVariantByFragranceID);
router.delete("/deletebagsvariants/:VariantID", ProductController.deleteBagVariantByVariantID)
router.delete("/deleteProductImageById/:id", ProductController.deleteProductImage)



module.exports = router;
