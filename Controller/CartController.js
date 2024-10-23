const db = require("../config.js");
// const addToCart=async(req,res)=>{
//     const {user_id, productID, size, color, quantity, price, wrap_id, message, delivery_date }=req.body;
//     const addToCartQuery=`INSERT INTO cart(user_id, productID, size, color, quantity, price, wrap_id, message, delivery_date) VALUES(?,?,?,?,?,?,?,?,?)`
//     db.query(addToCartQuery,[user_id, productID, size, color, quantity, price, wrap_id, message, delivery_date],(err,result)=>{
//         if(err) return res.status(500).json({error:err.message});
//         res.json({message:"Product added to cart successfully"});
//     });
 
// }
const addToCart = async (req, res) => {
    const { user_id, productID, size, color, quantity, price, wrap_id, message, delivery_date } = req.body;
  
    // Use a single query for insert or update
    const addToCartQuery = `
      INSERT INTO cart (user_id, productID, size, color, quantity, price, wrap_id, message, delivery_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        quantity = quantity + VALUES(quantity), 
        price = VALUES(price)
    `;
  
    try {
      const results = await new Promise((resolve, reject) => {
        db.query(addToCartQuery, [user_id, productID, size || null, color || null, quantity, price, wrap_id, message, delivery_date], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      
      return res.json({ message: "Product added or updated in cart successfully", results });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
  
  
const getCartByuserID = async (req, res) => {
    const { user_id } = req.params;
    const getCartQuery = `
    SELECT 
        c.id,
        c.size,
        c.color,
        c.quantity,
        c.price,
        c.message,
        c.delivery_date,
        product.id AS productID,
        product.name AS title,
        wrapgift.wrap_type AS wrap_type,
        wrapgift.img AS wrap_img,
        (SELECT img FROM product_images WHERE product_images.productID = product.id LIMIT 1) AS img
    FROM cart AS c
    JOIN product ON c.productID = product.id 
    LEFT JOIN wrapgift ON c.wrap_id = wrapgift.id  
    WHERE c.user_id = ?
    GROUP BY 
        c.id,       
        c.size,     
        c.color,   
        c.price,    
        product.name
    `;

    db.query(getCartQuery, [user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Format delivery_date in JavaScript
        const formattedResult = result.map(item => ({
            ...item,
            delivery_date: item.delivery_date ? new Date(item.delivery_date).toISOString().split('T')[0] : null, // Keep null if delivery_date is null
        }));
        
        res.json(formattedResult);
    });
};



const updateCartByuserID = async (req, res) => {
    const { id } = req.params;
    const { quantity, wrap_id, message, delivery_date } = req.body;

    const updateCartQuery = `
        UPDATE cart 
        SET 
            quantity = ?, 
            wrap_id = ?, 
            message = ?, 
            delivery_date = ?
            WHERE id = ?
    `;

    db.query(updateCartQuery, [quantity, wrap_id, message, delivery_date, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Cart updated successfully" });
    });
};

const deleteproductFromCart=async(req,res)=>{
    const {id}=req.params;
    const deleteProductQuery=`DELETE FROM cart WHERE id=?`
    db.query(deleteProductQuery,[id],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json({message:"Product deleted from cart successfully"});
    });
 
}
module.exports={addToCart,getCartByuserID,updateCartByuserID,deleteproductFromCart}