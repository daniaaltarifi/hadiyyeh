const db = require("../config.js");

const checkBrandIDExists = (brandID, callback) => {
  const query = `SELECT * FROM brands WHERE id = ?`;
  db.query(query, [brandID], (err, results) => {
    if (err) return callback(err);
    callback(null, results.length > 0);
  });
};

const addProduct = (req, res) => {
  const {
    name,
    description,
    sale,
    main_product_type,
    product_type,
    season,
    brandID,
    BagTypeID,
    BagVariants,
    FragranceTypeID,
    FragranceVariants,
    WatchTypeID,
    available,
    before_price,
    after_price,
    instock,
    Fragrancevariants
  } = req.body;

  const images = req.files;
  checkBrandIDExists(brandID, (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!exists) {
      return res.status(400).json({ error: "Invalid brandID." });
    }

    const productQuery = `
      INSERT INTO product (name, description, sale, main_product_type, product_type, season, brandID, instock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      productQuery,
      [
        name,
        description,
        sale,
        main_product_type,
        product_type,
        season,
        brandID,
        instock,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const lastProductId = result.insertId;
        console.log(lastProductId)
        if (images && images.length > 0) {
          const imageQueries = images.map((image) => {
            return new Promise((resolve, reject) => {
              const insertImageQuery = `INSERT INTO product_images (ProductID, img) VALUES (?, ?)`;
              db.query(
                insertImageQuery,
                [lastProductId, image.filename],
                (err) => {
                  if (err) reject(err);
                  resolve();
                }
              );
            });
          });

          Promise.all(imageQueries)
            .then(() => {
              handleProductTypeInsertion(
                main_product_type,
                lastProductId,
                BagTypeID,
                BagVariants,
                FragranceTypeID,
                FragranceVariants,
                WatchTypeID,
                available,
                before_price,
                after_price,
                res
              );
            })
            .catch((err) => res.status(500).json({ error: err.message }));
        } else {
          handleProductTypeInsertion(
            main_product_type,
            lastProductId,
            BagTypeID,
            BagVariants,
            FragranceTypeID,
            FragranceVariants,
            WatchTypeID,
            available,
            before_price,
            after_price,
            res
          );
        }
      }
    );
  });
};

const handleProductTypeInsertion = (
  main_product_type,
  lastProductId,
  BagTypeID,
  BagVariants,
  FragranceTypeID,
  FragranceVariants,
  WatchTypeId,
  available,
  before_price,
  after_price,
  res
) => {
  if (main_product_type === "Bag") {
    const insertBagQuery = `INSERT INTO bags (BagTypeID, ProductID) VALUES (?, ?)`;
    db.query(insertBagQuery, [BagTypeID, lastProductId], (err, bagResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const lastBagId = bagResult.insertId;

      if (BagVariants && BagVariants.length > 0) {
        const variantQueries = BagVariants.map((variant) => {
          return new Promise((resolve, reject) => {
            const variantQuery = `INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price, Color) VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(
              variantQuery,
              [
                lastBagId,
                variant.size,
                variant.available,
                variant.before_price,
                variant.after_price,
                variant.color,
              ],
              (err) => {
                if (err) reject(err);
                resolve();
              }
            );
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res.status(201).json({
              message: "Product and variants added as Bag with color.",
            })
          )
          .catch((err) => res.status(500).json({ error: err.message }));
      } else {
        res
          .status(201)
          .json({ message: "Product added as Bag without variants." });
      }
    });
  } else if (main_product_type === "Fragrance") {
    const insertFragranceQuery = `INSERT INTO fragrances (FragranceTypeID, ProductID) VALUES (?, ?)`;
    db.query(
      insertFragranceQuery,
      [FragranceTypeID, lastProductId],
      (err, fragranceResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const lastFragranceId = fragranceResult.insertId;
        if (FragranceVariants && FragranceVariants.length > 0) {
          
          const variantQueries = FragranceVariants.map((variant) => {
            return new Promise((resolve, reject) => {
              const variantQuery = `
                            INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price) 
                            VALUES (?, ?, ?, ?, ?)`;
              db.query(
                variantQuery,
                [
                  lastFragranceId,
                  variant.size,
                  variant.available,
                  variant.before_price,
                  variant.after_price,
                ],
                (err) => {
                  if (err) reject(err);
                  resolve();
                }
              );
            });
          });

          Promise.all(variantQueries)
            .then(() =>
              res
                .status(201)
                .json({ message: "Product and variants added as Fragrance." })
            )
            .catch((err) => res.status(500).json({ error: err.message }));
        } else {
          res
            .status(201)
            .json({ message: "Product added as Fragrance without variants." });
        }
      }
    );
  } else if (main_product_type === "Watch") {
    const ProductID  = lastProductId;
    const insertWatchQuery = `INSERT INTO watches ( WatchTypeId, Available, before_price, after_price,ProductID) VALUES (?, ?, ?, ?,?)`;
    db.query(
      insertWatchQuery,
      [ WatchTypeId,available,before_price,after_price,ProductID],
      (err, watchResult) => {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({ message: "Product added as Watch." });
      }
    );
  } else {
    res.status(400).json({ error: "Invalid main product type." });
  }
};

const updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    sale,
    main_product_type,
    product_type,
    season,
    brandID,
    BagTypeID,
    BagVariants,
    WatchTypeID,
    FragranceTypeID,
    instock,
  } = req.body;

  if (!id || !name || !main_product_type || !instock || !brandID) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const checkBrandQuery = `SELECT * FROM brands WHERE id = ?`;
  db.query(checkBrandQuery, [brandID], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid brandID." });
    }

    const productQuery = `
      UPDATE product 
      SET 
        name = ?, 
        description = ?, 
        sale = ?, 
        main_product_type = ?, 
        product_type = ?, 
        season = ?, 
        brandID = ?, 
        instock = ? 
      WHERE id = ?`;

    db.query(
      productQuery,
      [
        name,
        description,
        sale,
        main_product_type,
        product_type,
        season,
        brandID,
        instock === "Yes" ? "yes" : "no",
        id,
      ],
      (err) => {
        if (err) {
          console.error("Database update error:", err);
          return res.status(500).json({ error: err.message });
        }

        console.log("Updated product:", {
          id,
          name,
          description,
          sale,
          main_product_type,
          product_type,
          season,
          brandID,
          instock,
        });

        handleProductTypeUpdate(
          req,
          main_product_type,
          id,
          BagTypeID,
          BagVariants,
          WatchTypeID,
          FragranceTypeID,
          res
        );
      }
    );
  });
};

const handleProductTypeUpdate = (
  req,
  main_product_type,
  productId,
  BagTypeID,
  BagVariants,
  WatchTypeID,
  FragranceTypeID,
  res
) => {
  if (main_product_type === "Bag") {
    if (!BagTypeID) {
      return res.status(400).json({ error: "BagTypeID is required." });
    }
    const updateBagQuery = `UPDATE bags SET BagTypeID = ? WHERE ProductID = ?`;
    db.query(updateBagQuery, [BagTypeID, productId], (err) => {
      if (err) {
        console.error("Error updating bags:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated bag type for product:", { productId, BagTypeID });

      if (BagVariants && Array.isArray(BagVariants) && BagVariants.length > 0) {
        const variantQueries = BagVariants.map((variant) => {
          return new Promise((resolve, reject) => {
            const checkBagQuery = `SELECT COUNT(*) AS count FROM bags WHERE BagID = ?`;
            db.query(checkBagQuery, [variant.BagID], (err, results) => {
              if (err) {
                console.error("Error checking bag existence:", err);
                return reject(err);
              }

              if (results[0].count === 0) {
                const insertBagQuery = `INSERT INTO bags (BagID, BagTypeID, ProductID) VALUES (?, ?, ?)`;
                db.query(
                  insertBagQuery,
                  [variant.BagID, BagTypeID, productId],
                  (err) => {
                    if (err) {
                      console.error("Error inserting new bag:", err);
                      return reject(err);
                    }
                  }
                );
              }

              const variantQuery = `
                INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price, color)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  Size = VALUES(Size),
                  Available = VALUES(Available),
                  before_price = VALUES(before_price),
                  after_price = VALUES(after_price),
                  color = VALUES(color)`;

              db.query(
                variantQuery,
                [
                  variant.BagID,
                  variant.size,
                  variant.available,
                  variant.before_price,  
                  variant.after_price,    
                  variant.color,
                ],
                (err) => {
                  if (err) {
                    console.error("Error updating bag variants:", err);
                    reject(err);
                  } else {
                    console.log("Updated bag variant:", variant);
                    resolve();
                  }
                }
              );
            });
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res.status(200).json({
              message: "Product and variants updated as Bag with color.",
            })
          )
          .catch((err) => {
            console.error("Error handling variants:", err);
            res.status(500).json({ error: err.message });
          });
      } else {
        res
          .status(200)
          .json({ message: "Product updated as Bag without variants." });
      }
    });
  } else if (main_product_type === "Fragrance") {
    if (!FragranceTypeID) {
      return res.status(400).json({ error: "FragranceTypeID is required." });
    }
    const updateFragranceQuery = `UPDATE fragrances SET FragranceTypeID = ? WHERE ProductID = ?`;
    db.query(updateFragranceQuery, [FragranceTypeID, productId], (err) => {
      if (err) {
        console.error("Error updating fragrances:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log("Updated fragrance type for product:", { productId, FragranceTypeID });

      if (BagVariants && Array.isArray(BagVariants) && BagVariants.length > 0) {
        const variantQueries = BagVariants.map((variant) => {
          return new Promise((resolve, reject) => {
            const variantQuery = `
              INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                Size = ?, Available = ?, before_price = ?, after_price = ?`;
            db.query(
              variantQuery,
              [  
                variant.FragranceID,
                variant.size,
                variant.available,
                variant.before_price,  
                variant.after_price,    
                variant.size,
                variant.available,
                variant.before_price,
                variant.after_price,
              ],
              (err) => {
                if (err) {
                  console.error("Error updating fragrance variants:", err);
                  reject(err);
                } else {
                  console.log("Updated fragrance variant:", variant);
                  resolve();
                }
              }
            );
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res.status(200).json({ message: "Product updated as Fragrance." })
          )
          .catch((err) => {
            console.error("Error handling variants:", err);
            res.status(500).json({ error: err.message });
          });
      } else {
        res.status(200).json({ message: "Product updated as Fragrance." });
      }
    });
  } else if (main_product_type === "Watch") {
    if (!WatchTypeID) {
      console.log(req.body); 
      return res.status(400).json({ error: "WatchTypeID is required." });
    }

    const { available, before_price, after_price } = req.body;

    const updateWatchQuery = `
      UPDATE watches 
      SET 
        WatchTypeID = ?, 
        Available = ?, 
        before_price = ?, 
        after_price = ? 
      WHERE ProductID = ?`;

    db.query(updateWatchQuery, [WatchTypeID, available, before_price, after_price, productId], (err) => {
      if (err) {
        console.error("Error updating watches:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated watch for product:", { productId, WatchTypeID });
      res.status(200).json({ message: "Product updated as Watch." });
    });
}
else {
    res.status(400).json({ error: "Invalid main product type." });
  }
};



const getProductDetails = async (req, res) => {
  const productId = req.params.id;
  const productQuery = `
    SELECT p.*, b.BagTypeID, w.WatchTypeID, f.FragranceTypeID, br.brand_name AS brand_name
    FROM product p
    LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN watches w ON p.id = w.ProductID
    LEFT JOIN fragrances f ON p.id = f.ProductID
    LEFT JOIN brands br ON p.brandID = br.id
    WHERE p.id = ?`;

  try {
    const [productResults] = await db
      .promise()
      .query(productQuery, [productId]);

    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const product = productResults[0];

   
    const imagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
    const [imageResults] = await db.promise().query(imagesQuery, [productId]);

  
    let variantsQuery = "";
    if (product.main_product_type === "Bag") {
      variantsQuery = `
        SELECT Size, Color, Available, before_price, after_price 
        FROM bagvariants 
        WHERE BagID = (SELECT BagID FROM bags WHERE ProductID = ?)`;
    } else if (product.main_product_type === "Watch") {
      variantsQuery = `
        SELECT Available, before_price, after_price 
        FROM watches 
        WHERE ProductID = ?`;
    } else if (product.main_product_type === "Fragrance") {
      variantsQuery = `
        SELECT Size, Available, before_price, after_price 
        FROM fragrancevariants 
        WHERE FragranceID = (SELECT FragranceID FROM fragrances WHERE ProductID = ?)`;
    }

    
    let variantResults = [];
    if (variantsQuery) {
      [variantResults] = await db.promise().query(variantsQuery, [productId]);
    }

   
    const response = {
      product,
      images: imageResults.map((img) => img.img),
      variants: [],
    };

    
    const sizeMap = {};
    if (variantResults.length > 0) {
      if (product.main_product_type === "Bag") {
        variantResults.forEach(
          ({ Color, Size, Available, before_price, after_price }) => {
            if (Available === "Yes") {
              if (!sizeMap[Size]) {
                sizeMap[Size] = { size: Size, prices: [] };
              }
              sizeMap[Size].prices.push({
                color: Color,
                before_price,
                after_price,
              });
            }
          }
        );
      } else if (product.main_product_type === "Fragrance") {
        variantResults.forEach(
          ({ Size, Available, before_price, after_price }) => {
            if (!sizeMap[Size]) {
              sizeMap[Size] = { size: Size, prices: [] };
            }
            sizeMap[Size].prices.push({
              before_price,
              after_price,
              available: Available === "Yes",
            });
          }
        );
      } else if (product.main_product_type === "Watch") {
        variantResults.forEach(({ Available, before_price, after_price }) => {
          if (Available === "Yes") {
            response.variants.push({ before_price, after_price });
          }
        });
        return res.status(200).json(response);
      }
    }

   
    response.variants = Object.values(sizeMap).map(({ size, prices }) => ({
      size,
      prices,
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getProducts = (req, res) => {
  const { main_product_type } = req.params;
  const productQuery = `
      SELECT 
          p.id, 
          p.name, 
          p.before_price,
          p.description,
          p.main_product_type, 
          p.sale, 
          p.instock,
          fv.size,
          br.brand_name,
          (SELECT img FROM product_images WHERE ProductID = p.id LIMIT 1) AS first_image,
          (SELECT img FROM product_images WHERE ProductID = p.id ORDER BY id LIMIT 1 OFFSET 1) AS second_image,
          COALESCE(MIN(bv.Size), MIN(fv.Size)) AS size,
          COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
          COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
      FROM product p
      LEFT JOIN bags b ON p.id = b.ProductID
      LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
      LEFT JOIN fragrances f ON p.id = f.ProductID  
      LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
      LEFT JOIN watches w ON p.id = w.ProductID
      LEFT JOIN brands br ON p.BrandID = br.id
      WHERE p.main_product_type = ?
      GROUP BY p.id`;

  db.query(productQuery, [main_product_type], (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching products." });
    }
    console.log(results); 
    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this type." });
    }

    const formattedResults = results.map(
      ({
        id,
        name,
        main_product_type,
        sale,
        instock,
        size,
        brand_name,
        first_image,
        second_image,
        after_price,
        before_price,
      }) => ({
        id,
        name,
        main_product_type,
        sale,
        instock,
        size: size || null,
        brand_name: brand_name || null,
        first_image,
        second_image,
        after_price: after_price || null,
        before_price: before_price || null,
      })
    );

    res.status(200).json(formattedResults);
  });
};

const getProductTypes = (req, res) => {
  const productQuery = `
    SELECT DISTINCT p.main_product_type
    FROM product p
  `;

  db.query(productQuery, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const formattedResults = results.map(({ main_product_type }) => ({
      main_product_type,
    }));

    res.status(200).json(formattedResults);
  });
};

const deleteProduct = (req, res) => {
  const { id } = req.params;
  const sqlDelete = "DELETE FROM product WHERE id = ? ";
  const deleteFeedBack = "DELETE FROM feedback WHERE product_id = ?";
  db.query(deleteFeedBack, [id], (err, result) => {
    if (err) {
      return res.json({ message: err.message });
    }
  });
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      return res.json({ message: err.message });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching record found to delete" });
    }
    res.status(200).json({ message: "product deleted successfully" });
  });
};
const getProductBysubType = (req, res) => {
  const { type, subtype } = req.query;

  let query;
  let params = [];

  if (type === "Fragrance") {
    query = `
      SELECT p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, fv.Size, fv.before_price, fv.after_price, MIN(pi.img) AS first_image 
      FROM product p 
      JOIN fragrances f ON p.id = f.ProductID 
      JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE f.FragranceTypeID = ? 
      GROUP BY p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, fv.Size, fv.before_price, fv.after_price`;
    params.push(subtype);
  } else if (type === "Bags") {
    query = `
      SELECT p.id, p.name, p.instock, p.brandID, br.brand_name, bv.Size, bv.before_price, bv.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN bags b ON p.id = b.ProductID 
      JOIN bagvariants bv ON b.BagID = bv.BagID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE b.BagTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.brandID, br.brand_name, bv.Size, bv.before_price, bv.after_price`;
    params.push(subtype);
  } else if (type === "Watches") {
    query = `
      SELECT p.id, p.name, p.instock, p.brandID, br.brand_name, w.before_price, w.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN watches w ON p.id = w.ProductID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE w.WatchTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.brandID, br.brand_name, w.before_price, w.after_price`;
    params.push(subtype);
  } else {
    return res.status(400).json({ error: "Invalid product type" });
  }

  db.query(query, params, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

   
    const productsMap = {};

    results.forEach((result) => {
      const {
        id,
        name,
        sale,
        instock,
        brandID,
        brand_name,
        Size,
        before_price,
        after_price,
        first_image,
      } = result;

      
      if (!productsMap[id]) {
        productsMap[id] = {
          id,
          name,
          sale,
          instock,
          brandID,
          brand_name,
          first_image,
          sizes: [],
        };
      }

    
      productsMap[id].sizes.push({
        Size,
        before_price,
        after_price,
      });
    });

 
    const finalResults = Object.values(productsMap);
    res.json(finalResults);
  });
};

module.exports = {
  addProduct,
  getProductDetails,
  getProducts,
  deleteProduct,
  getProductBysubType,
  updateProduct,
  getProductTypes,
};