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
    instock
    } = req.body;

  // Handle image files
  const images = req.files; // Get all uploaded images
  console.log(req.body);

  // Insert into product table
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

      const lastProductId = result.insertId; // Get the last inserted product ID

      // Check if images were uploaded
      if (images && images.length > 0) {
        // Insert image paths into product_images table
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
            // Now handle the specific product type insertion
            handleProductTypeInsertion(
              main_product_type,
              lastProductId,
              BagTypeID,
              BagVariants,
              res
            );
          })
          .catch((err) => res.status(500).json({ error: err.message }));
      } else {
        // If no images were uploaded, just proceed with product type insertion
        handleProductTypeInsertion(
          main_product_type,
          lastProductId,
          BagTypeID,
          BagVariants,
          res
        );
      }
    }
  );
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
    variants,
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
          variants,
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
  variants,
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
                INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price, Color)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  Size = VALUES(Size),
                  Available = VALUES(Available),
                  before_price = VALUES(before_price),
                  after_price = VALUES(after_price),
                  Color = VALUES(Color)`;

                INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  Size = ?, Available = ?, before_price = ?, after_price = ?`;
              db.query(
                variantQuery,
                [
                  variant.BagID,
                  variant.size,
                  variant.available,
                  variant.before_price,
                  variant.after_price,
                  variant.Color,
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
      console.log("Updated fragrance type for product:", {
        productId,
        FragranceTypeID,
      });
      console.log("Updated fragrance type for product:", { productId, FragranceTypeID });

      if (variants && Array.isArray(variants) && variants.length > 0) {
        const variantQueries = variants.map((variant) => {
          return new Promise((resolve, reject) => {
            const checkFragranceQuery = `SELECT COUNT(*) AS count FROM fragrances WHERE FragranceID = ?`;
            db.query(
              checkFragranceQuery,
              [variant.FragranceID],
              (err, results) => {
                if (err) {
                  console.error("Error checking fragrance existence:", err);
                  return reject(err);
                }

                if (results[0].count === 0) {
                  console.error(
                    "FragranceID does not exist:",
                    variant.FragranceID
                  );
                  return reject(new Error("Invalid FragranceID."));
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

                const variantQuery = `
               INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  Size = VALUES(Size),
  Available = VALUES(Available),
  before_price = VALUES(before_price),
  after_price = VALUES(after_price);

                  `;

                db.query(
                  variantQuery,
                  [
                    variant.FragranceID,
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

    db.query(
      updateWatchQuery,
      [WatchTypeID, available, before_price, after_price, productId],
      (err) => {
        if (err) {
          console.error("Error updating watches:", err);
          return res.status(500).json({ error: err.message });
        }

        console.log("Updated watch for product:", { productId, WatchTypeID });
        res.status(200).json({ message: "Product updated as Watch." });
      }
    );
  } else {
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

      SELECT 
          p.id, 
          p.name, 
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
    if (err) return res.status(500).json({ error: err.message });

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
const getAllProductsWithVariantsCMS = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedDate,  
        p.product_type AS productType,
        p.season AS season,
        p.sale AS sale,  
        b.BagID AS BagID,
        bv.Color AS bagColor,
        bv.Size AS bagSize,  -- إضافة Size هنا
        bv.before_price AS bagBeforePrice,
        bv.after_price AS bagAfterPrice,  
        bv.VariantID AS bagVariantId, 
        f.FragranceID AS FragranceID,
        fv.VariantFragranceID AS fragranceVariantId,
        fv.Size AS fragranceSize,
        fv.Available AS fragranceAvailable,
        fv.before_price AS fragranceBeforePrice,
        fv.after_price AS fragranceAfterPrice,
        w.WatchID AS watchId,
        w.Available AS watchAvailable,
        w.before_price AS watchBeforePrice,
        w.after_price AS watchAfterPrice,
        br.brand_name AS brandName
      FROM 
        product p
      LEFT JOIN 
        bags b ON p.id = b.ProductID
      LEFT JOIN 
        bagvariants bv ON b.BagID = bv.BagID 
      LEFT JOIN 
        fragrances f ON p.id = f.ProductID
      LEFT JOIN 
        fragrancevariants fv ON f.FragranceID = fv.FragranceID
      LEFT JOIN 
        watches w ON p.id = w.ProductID
      LEFT JOIN 
        brands br ON br.id = p.brandID
    `;

    const [products] = await db.promise().query(query);

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found." });
    }

    const productMap = {};

    products.forEach((product) => {
      const productId = product.id;

      if (!productMap[productId]) {
        productMap[productId] = {
          product: {
            id: product.id,
            name: product.name,
            brand: product.brandName,
            main_product_type: product.main_product_type,
            product_type: product.productType,
            season: product.season,
            sale: product.sale,
            updated_at: product.updatedDate,
            description: product.description,
            FragranceID: product.FragranceID,
            BagID: product.BagID,
          },
          variants: [],
        };
      }

      if (product.main_product_type === "Fragrance" && product.FragranceID) {
        productMap[productId].variants.push({
          VariantID: product.fragranceVariantId,
          Size: product.fragranceSize,
          Available: product.fragranceAvailable,
          before_price: product.fragranceBeforePrice,
          after_price: product.fragranceAfterPrice,
        });
      } else if (product.main_product_type === "Bag" && product.BagID) {
        productMap[productId].variants.push({
          VariantID: product.bagVariantId,
          Color: product.bagColor,
          Size: product.bagSize, 
          before_price: product.bagBeforePrice,
          after_price: product.bagAfterPrice,
        });
      } else if (product.main_product_type === "Watch" && product.watchId) {
        productMap[productId].variants.push({
          Available: product.watchAvailable,
          before_price: product.watchBeforePrice,
          after_price: product.watchAfterPrice,
        });
      }
    });

    const response = Object.values(productMap).map((item) => ({
      product: item.product,
      variants: item.variants,
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ error: "An error occurred while fetching products." });
  }
};
const updateFragranceVariant = (req, res) => {
  const { id } = req.params;
  const { Size, Available, before_price, after_price } = req.body;

  if (
    !id ||
    !Size ||
    !Available ||
    before_price === undefined ||
    after_price === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (Available !== "yes" && Available !== "no") {
    return res
      .status(400)
      .json({ error: "Available must be 'yes' or 'no'." });
  }

  const updateQuery = `
    UPDATE fragrancevariants 
    SET 
      Size = ?, 
      Available = ?, 
      before_price = ?, 
      after_price = ? 
    WHERE variantFragranceID  = ?`;

  db.query(
    updateQuery,
    [Size, Available, before_price, after_price, id],
    (err) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated fragrance variant:", {
        id,
        Size,
        Available,
        before_price,
        after_price,
      });

      res
        .status(200)
        .json({ message: "Fragrance variant updated successfully." });
    }
  );
};

const updateBagVariants = (req, res) => {
  const { id } = req.params;
  const { Size, Available, before_price, after_price, color } = req.body;

  if (
    !id ||
    !Size ||
    !Available ||
    before_price === undefined ||
    after_price === undefined ||
    !color
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (Available !== "Yes" && Available !== "No") {
    return res.status(400).json({ error: "Available must be 'Yes' or 'No'." });
  }

  const updateQuery = `
    UPDATE bagvariants 
    SET 
      Size = ?, 
      Available = ?, 
      before_price = ?, 
      after_price = ?, 
      color = ? 
    WHERE VariantID = ?`;

  db.query(
    updateQuery,
    [Size, Available, before_price, after_price, color, id],
    (err) => {
      if (err) {
        console.error("Database update error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Updated bag variant:", {
        id,
        Size,
        Available,
        before_price,
        after_price,
        color,
      });

      res.status(200).json({ message: "Bag variant updated successfully." });
    }
  );
};
const getFragranceVariantsById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing ID parameter." });
  }
  const query = `
    SELECT * FROM fragrancevariants 
    WHERE variantFragranceID  = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No fragrance variants found for this product ID." });
    }

    res.status(200).json(results);
  });
};

const getBagVariantsById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing ID parameter." });
  }

  const query = `
    SELECT * FROM bagvariants 
    WHERE VariantID  = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No bag variants found for this product ID." });
    }

    res.status(200).json(results);
  });
};
const getProductById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing ID parameter." });
  }

  const productQuery = `
    SELECT p.*, 
           w.WatchTypeID AS WatchTypeID, 
           wt.TypeName AS WatchTypeName, 
           w.Available  AS Available,  
           w.before_price AS WatchBeforePrice,
           w.after_price AS WatchAfterPrice,
           b.BagTypeID AS BagTypeID, 
           bt.TypeName AS BagTypeName,
           bv.VariantID AS BagVariantID,
           bv.Size AS BagSize,
           bv.Color AS BagColor,
           bv.Available AS BagAvailable,
           bv.before_price AS BagBeforePrice,
           bv.after_price AS BagAfterPrice,
           f.FragranceTypeID AS FragranceTypeID,
           ft.TypeName AS FragranceTypeName,
           fv.variantFragranceID AS FragranceVariantID,
           fv.Size AS FragranceSize,
           fv.Available AS FragranceAvailable,
           fv.before_price AS FragranceBeforePrice,
           fv.after_price AS FragranceAfterPrice
    FROM product p
    LEFT JOIN watches w ON p.id = w.ProductID
    LEFT JOIN watchtypes wt ON w.WatchTypeID = wt.WatchTypeID
    LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN bagtypes bt ON b.BagTypeID = bt.BagTypeID
    LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
    LEFT JOIN fragrances f ON p.id = f.ProductID
    LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
    LEFT JOIN fragrancetypes ft ON f.FragranceTypeID = ft.FragranceTypeID
    WHERE p.id = ?`;

  db.query(productQuery, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Database query error: " + err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No product found for this ID." });
    }

    const product = results[0];

    const imagesQuery = `
      SELECT img,id FROM product_images
      WHERE ProductID = ?`;

    db.query(imagesQuery, [id], (err, imageResults) => {
      if (err) {
        console.error("Database query error (images):", err);
        return res.status(500).json({ error: "Error fetching images: " + err.message });
      }

      const images = imageResults.map((image, index) => ({
        id: image.id,  
        img: image.img  
      }));

      const productWithImagesAndType = {
        ...product,
        images: images,
      };

      res.status(200).json(productWithImagesAndType);
    });
  });
};
const deleteFragranceVariantByFragranceID = (req, res) => {
  const { variantFragranceID } = req.params;

  if (!variantFragranceID) {
    return res.status(400).json({ message: "FragranceID is required" });
  }

  console.log(
    `Attempting to delete fragrance variants with FragranceID: ${variantFragranceID}`
  );

  const deleteVariantQuery =
    "DELETE FROM fragrancevariants WHERE variantFragranceID  = ?";

  db.query(deleteVariantQuery, [variantFragranceID], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching fragrance variants found to delete" });
    }

    res
      .status(200)
      .json({ message: "Fragrance variants deleted successfully" });
  });
};

const deleteBagVariantByVariantID = (req, res) => {
  const { VariantID } = req.params;

  if (!VariantID) {
    return res.status(400).json({ message: "VariantID is required" });
  }

  console.log(`Attempting to delete bag variant with VariantID: ${VariantID}`);

  const deleteVariantQuery = "DELETE FROM bagvariants WHERE VariantID = ?";

  db.query(deleteVariantQuery, [VariantID], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching bags variants found to delete" });
    }

    res.status(200).json({ message: "Bags variants deleted successfully" });
  });
};
const deleteProductImage = (req, res) => {
  const { id } = req.params; 

  if (!id) {
    return res.status(400).json({ error: "Missing Image ID parameter." });
  }

  const query = `
    DELETE FROM product_images 
    WHERE id = ?`; 

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);  
      return res.status(500).json({ error: err.message });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "No image found with the given ID." });
    }

    res.status(200).json({ message: "Image deleted successfully." });
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
  getAllProductsWithVariantsCMS,
  updateFragranceVariant,
  updateBagVariants,
  getFragranceVariantsById,
  getBagVariantsById,
  getProductById,
  deleteFragranceVariantByFragranceID,
  deleteBagVariantByVariantID,
  deleteProductImage
};