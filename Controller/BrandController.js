const db = require("../config.js");
const addBrand = async (req, res) => {
  const { brand_name } = req.body;
  const brand_img =
    req.files && req.files["brand_img"]
      ? req.files["brand_img"][0].filename
      : null;
  const addBrandQuery = `INSERT INTO brands(brand_name, brand_img) VALUES(?, ?)`;
  db.query(addBrandQuery, [brand_name, brand_img], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Brand added successfully" });
  });
};

const getAllBrands = async (req, res) => {
  const getBrand = `SELECT * FROM brands `;
  db.query(getBrand, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

const getProductBasedOnBrands = async (req, res) => {
  const { brand } = req.params;
  const getProduct = `
    SELECT p.id, p.name, p.sale, 
           GROUP_CONCAT(pi.img) AS images, 
           br.brand_name AS brand_name,
           br.brand_img AS brand_img,
             COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
      COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
    FROM product p 
    LEFT JOIN product_images pi ON p.id = pi.ProductID 
    LEFT JOIN brands br ON p.brandID = br.id
     LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
    LEFT JOIN fragrances f ON p.id = f.ProductID  
    LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
    LEFT JOIN watches w ON p.id = w.ProductID
    WHERE br.brand_name = ?
    GROUP BY p.id`;

  db.query(getProduct, [brand], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

const sizesBags = (req, res) => {
  const sizesBags = "SELECT DISTINCT size FROM bagvariants";
  db.query(sizesBags, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const sizesFragrance = (req, res) => {
  const sizesFragrance = "SELECT DISTINCT size FROM fragrancevariants";
  db.query(sizesFragrance, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const getSeasons = (req, res) => {
  const seasons = "SELECT DISTINCT season FROM product";
  db.query(seasons, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const getProductBySeasons = (req, res) => {
  const { season } = req.params;
  const getProduct = `
        SELECT p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, MIN(pi.img) AS first_image,
          COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
      COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
        FROM product p
         JOIN product_images pi ON p.id = pi.ProductID
          JOIN brands br ON p.brandID = br.id
           LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
    LEFT JOIN fragrances f ON p.id = f.ProductID  
    LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
    LEFT JOIN watches w ON p.id = w.ProductID
     WHERE p.season =? GROUP BY p.id`;
  db.query(getProduct, [season], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const getAllProducts = (req, res) => {
  const getAllProduct = `
  SELECT 
    p.id,
    p.name, 
    p.sale, 
    p.instock,
    p.brandID, 
    br.brand_name,
    MIN(pi.img) AS first_image,
    COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
    COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
  FROM product p
  JOIN product_images pi ON p.id = pi.ProductID
  JOIN brands br ON p.brandID = br.id
  LEFT JOIN bags b ON p.id = b.ProductID
  LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
  LEFT JOIN fragrances f ON p.id = f.ProductID  
  LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
  LEFT JOIN watches w ON p.id = w.ProductID
  GROUP BY p.id
`;

  db.query(getAllProduct, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const getLatestProduct = async (req, res) => {
  const getLatestProduct = `
    SELECT p.id, p.name, p.sale, p.instock, MIN(pi.img) AS first_image,
          COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
      COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
        FROM product p
         JOIN product_images pi ON p.id = pi.ProductID
          LEFT JOIN bags b ON p.id = b.ProductID
  LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
  LEFT JOIN fragrances f ON p.id = f.ProductID  
  LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
  LEFT JOIN watches w ON p.id = w.ProductID
  GROUP BY p.id
  ORDER BY p.updated_at DESC
    LIMIT 20;
`;
  db.query(getLatestProduct, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const updateBrand=async(req,res)=>{
  const {id} = req.params; 
  const {brand_name} = req.body;
  const brand_img =
      req.files && req.files["brand_img"] ? req.files["brand_img"][0].filename : null;
  const updateBrandQuery = `UPDATE brands SET brand_name =?, brand_img =? WHERE id =?`;
  db.query(updateBrandQuery, [brand_name,brand_img, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Brand updated successfully" });
  });
}
const getBrandByid=async(req,res)=>{
const {id} = req.params;
  const getBrandQuery = `SELECT * FROM brands WHERE id =?`;
  db.query(getBrandQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
}
const deleteBrand=async(req,res)=>{
  const {id} = req.params;
  const deleteBrandQuery = `DELETE FROM brands WHERE id =?`;
  db.query(deleteBrandQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Brand deleted successfully" });
  });

}
module.exports = {
  addBrand,
  getAllBrands,
  updateBrand,
  getBrandByid,
  deleteBrand,
  getProductBasedOnBrands,
  // GET SIZES
  sizesBags,
  sizesFragrance,
  // GET SEASONS
  getSeasons,
  getProductBySeasons,
  //GET ALL PRODUCT
  getAllProducts,
  getLatestProduct,
};
