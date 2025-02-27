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

     
        if (images && images.length > 0) {
          const imageQueries = images.map((image) => {
            return new Promise((resolve, reject) => {
              const insertImageQuery = `
                INSERT INTO product_images (ProductID, img)
                VALUES (?, ?)`;
              db.query(insertImageQuery, [lastProductId, image.filename], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          });

          Promise.all(imageQueries)
            .then(() => {
        
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

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    sale,
    main_product_type,
    product_type,
    season,
    brandID,
    instock,
    BagTypeID,
    BagVariants,
    FragranceTypeID,
    FragranceVariants,
    WatchTypeID,
  } = req.body;

  if (!id || !name || !main_product_type || !instock || !brandID) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {

    const [brandCheck] = await db.promise().query(`SELECT * FROM brands WHERE id = ?`, [brandID]);
    if (brandCheck.length === 0) {
      return res.status(400).json({ error: "Invalid brandID." });
    }

 
    const updateProductQuery = `
      UPDATE product
      SET name = ?, description = ?, sale = ?, main_product_type = ?, 
          product_type = ?, season = ?, brandID = ?, instock = ?
      WHERE id = ?`;
    await db.promise().query(updateProductQuery, [
      name,
      description,
      sale ? "Yes" : "No",
      main_product_type,
      product_type,
      season,
      brandID,
      instock === "Yes" ? "yes" : "no",
      id,
    ]);

    console.log(`Product updated: ${id}`);

  
    if (main_product_type === "Bag") {
      await handleBagUpdates(id, BagTypeID, BagVariants);
    } else if (main_product_type === "Fragrance") {
      await handleFragranceUpdates(id, FragranceTypeID, FragranceVariants);
    } else if (main_product_type === "Watch") {
      await handleWatchUpdates(id, WatchTypeID);
    } else {
      return res.status(400).json({ error: "Invalid main product type." });
    }

    res.status(200).json({ success: true, message: "Product updated successfully." });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: err.message });
  }
};


const handleBagUpdates = async (productId, BagTypeID, BagVariants) => {
  if (!BagTypeID) {
    throw new Error("BagTypeID is required.");
  }


  const updateBagQuery = `UPDATE bags SET BagTypeID = ? WHERE ProductID = ?`;
  await db.promise().query(updateBagQuery, [BagTypeID, productId]);

  console.log(`Bag type updated for product: ${productId}`);


  if (BagVariants && Array.isArray(BagVariants)) {
    for (const variant of BagVariants) {
      const variantQuery = `
        INSERT INTO bagvariants (BagID, Size, Available, before_price, after_price)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          Size = VALUES(Size),
          Available = VALUES(Available),
          before_price = VALUES(before_price),
          after_price = VALUES(after_price)`;
      await db.promise().query(variantQuery, [
        variant.BagID,
        variant.Size,
        variant.Available,
        variant.before_price,
        variant.after_price,
      ]);
      console.log("Bag variant updated:", variant);
    }
  }
};


const handleFragranceUpdates = async (productId, FragranceTypeID, FragranceVariants) => {
  if (!FragranceTypeID) {
    throw new Error("FragranceTypeID is required.");
  }


  const updateFragranceQuery = `UPDATE fragrances SET FragranceTypeID = ? WHERE ProductID = ?`;
  await db.promise().query(updateFragranceQuery, [FragranceTypeID, productId]);

  console.log(`Fragrance type updated for product: ${productId}`);


  if (FragranceVariants && Array.isArray(FragranceVariants)) {
    for (const variant of FragranceVariants) {
      const variantQuery = `
        INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          Size = VALUES(Size),
          Available = VALUES(Available),
          before_price = VALUES(before_price),
          after_price = VALUES(after_price)`;
      await db.promise().query(variantQuery, [
        variant.FragranceID,
        variant.Size,
        variant.Available,
        variant.before_price,
        variant.after_price,
      ]);
      console.log("Fragrance variant updated:", variant);
    }
  }
};


const handleWatchUpdates = async (productId, WatchTypeID) => {
  if (!WatchTypeID) {
    throw new Error("WatchTypeID is required.");
  }

 
  const updateWatchQuery = `UPDATE watches SET WatchTypeID = ? WHERE ProductID = ?`;
  await db.promise().query(updateWatchQuery, [WatchTypeID, productId]);

  console.log(`Watch type updated for product: ${productId}`);
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

    // Query to get product images
    const imagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
    const [imageResults] = await db.promise().query(imagesQuery, [productId]);

    // Query to get variants based on the product type
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

    // Execute the variants query if applicable
    let variantResults = [];
    if (variantsQuery) {
      [variantResults] = await db.promise().query(variantsQuery, [productId]);
    }

    // Prepare the response object
    const response = {
      product,
      images: imageResults.map((img) => img.img),
      variants: [],
    };

    // Process variants based on product type
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
                Color: Color,
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

    // Transform sizeMap into the desired response format
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



const getProductDetailsDashboard = async (req, res) => {
  const productId = req.params.id;

  const productQuery = `
  SELECT 
    p.*, 
    b.BagTypeID, 
    w.WatchTypeID, 
    f.FragranceTypeID, 
    ft.TypeName AS FragranceTypeName, 
    bt.TypeName AS BagTypeName, 
    wt.TypeName AS WatchTypeName, 
    br.brand_name AS brand_name
FROM 
    product p
LEFT JOIN 
    bags b ON p.id = b.ProductID
LEFT JOIN 
    watches w ON p.id = w.ProductID
LEFT JOIN 
    fragrances f ON p.id = f.ProductID
LEFT JOIN 
    fragrancetypes ft ON f.FragranceTypeID = ft.FragranceTypeID 
LEFT JOIN 
    bagtypes bt ON bt.BagTypeID = b.BagTypeID 
LEFT JOIN 
    watchtypes wt ON wt.WatchTypeID = w.WatchTypeID 
LEFT JOIN 
    brands br ON p.brandID = br.id
WHERE 
    p.id = ?
`;

  try {
    const [productResults] = await db
      .promise()
      .query(productQuery, [productId]);

    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const product = productResults[0];

    const imagesQuery = `SELECT img, id FROM product_images WHERE ProductID = ?`;
    const [imageResults] = await db.promise().query(imagesQuery, [productId]);


    const response = {
      product,
      images: imageResults.map((img) => ({ id: img.id, img: img.img })), 
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};






const getProductByIdWithVariantsCMS = async (req, res) => {
  try {
    const { id } = req.params; 
    const query = `
      SELECT 
        p.*,
        DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedDate,  
        p.product_type AS productType,
        p.season AS season,
        p.sale AS sale,  
        b.BagID AS BagID,
        bv.Color AS bagColor,
        bv.Size AS bagSize, 
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
      WHERE 
        p.id = ? 
    `;

    const [products] = await db.promise().query(query, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: "No product found with the given ID." });
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

    return res.status(200).json(response[0]); 
  } catch (err) {
    console.error("Error fetching product:", err);
    return res.status(500).json({ error: "An error occurred while fetching the product." });
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

      `SELECT 
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

    // Create a map to group results by product
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

      // If product doesn't exist in the map, create a new entry
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

      // Push size details for each product
      productsMap[id].sizes.push({
        Size,
        before_price,
        after_price,
      });
    });

    // Convert the map to an array of products
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
        p.instock AS instock,
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
            instock: product.instock,
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

      const images = imageResults.map((image) => ({
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
  getAllProductsWithVariantsCMS,
  getProductDetailsDashboard,
  getProductByIdWithVariantsCMS,
  updateFragranceVariant,
  updateBagVariants,
  getFragranceVariantsById,
  getProductById,
  getBagVariantsById,
  deleteFragranceVariantByFragranceID,
  deleteBagVariantByVariantID,
  addProduct,
  getProductDetails,
  getProducts,
  deleteProduct,
  getProductBysubType,
  updateProduct,
  getProductTypes,
};
