const db = require('../config.js');

const addOrder = async (req, res) => {
    const { user_id, address_id, shipping_method, payment_method, total_price, order_items } = req.body;
    const orderStatus = payment_method === 'cliq' ? 'Pending' : 'Confirmed';

    const addOrderQuery = `INSERT INTO orders (user_id, address_id, shipping_method, payment_method, total_price, order_status) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(addOrderQuery, [user_id, address_id, shipping_method, payment_method, total_price, orderStatus], (err, orderResult) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const orderId = orderResult.insertId; // Get the newly created order ID
        const orderItemsQuery = `INSERT INTO order_items (order_id, product_id, quantity, size, color, price, message, wrap_type, delivery_date) VALUES ?`;
        const values = order_items.map(item => [orderId, item.product_id, item.quantity, item.size, item.color, item.price, item.message, item.wrap_type, item.delivery_date]);
        db.query(orderItemsQuery, [values], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Delete the cart items for the user
            const delCart = `DELETE FROM cart WHERE user_id = ?`;
            db.query(delCart, [user_id], (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Send success response after deleting the cart
                res.json({ message: "Order added successfully", orderId });
            });
        });
    });
};


//get order items by is or user id think about that
// const addOrder = async (req, res) => {
//     const { user_id, address_id, shipping_method, payment_method, total_price, order_items, discount_code } = req.body;
//     // Input validation
//     if (!user_id || !address_id || !shipping_method || !payment_method || !total_price || !order_items || order_items.length === 0) {
//         return res.status(400).json({ error: "All fields are required." });
//     }
//     try {
//         let discount = 0;
//         // Validate discount code if provided
//         if (discount_code) {
//             const discountQuery = `
//                 SELECT discount_percentage 
//                 FROM discount_codes 
//                 WHERE code = ? 
//                 AND (expiration_date IS NULL OR expiration_date > NOW())
//             `;
//             const [rows] = await db.promise().query(discountQuery, [discount_code]);

//             if (rows.length > 0) {
//                 discount = rows[0].discount_percentage;
//             } else {
//                 return res.status(400).json({ error: "Invalid or expired discount code." });
//             }
//         }
//         // Calculate final price after applying discount
//         const discountAmount = (total_price * discount) / 100;
//         const finalPrice = total_price - discountAmount;
//         const orderStatus = payment_method === 'cliq' ? 'Pending' : 'Confirmed';
//         // Insert the order
//         const addOrderQuery = `
//             INSERT INTO orders (user_id, address_id, shipping_method, payment_method, total_price, order_status) 
//             VALUES (?, ?, ?, ?, ?, ?)
//         `;
//         const [orderResult] = await db.promise().query(addOrderQuery, [user_id, address_id, shipping_method, payment_method, finalPrice, orderStatus]);
//         const orderId = orderResult.insertId; // Get the newly created order ID

//         // Prepare order items for insertion
//         const orderItemsQuery = `
//             INSERT INTO order_items (order_id, product_id, quantity, size, color, price, message, wrap_type, delivery_date) 
//             VALUES ?
//         `;
//         const values = order_items.map(item => [
//             orderId, item.product_id, item.quantity, item.size, item.color, item.price, item.message, item.wrap_type, item.delivery_date
//         ]);

//         // Insert order items
//         await db.promise().query(orderItemsQuery, [values]);

//         // Delete the cart items for the user
//         const delCartQuery = `DELETE FROM cart WHERE user_id = ?`;
//         await db.promise().query(delCartQuery, [user_id]);

//         // Send success response
//         res.json({ message: "Order added successfully", orderId, finalPrice });
//     } catch (err) {
//         return res.status(500).json({ error: err.message });
//     }
// };

const getorderByUserId = async (req, res) => {
    const { user_id } = req.params;

    // SQL query to get orders, their associated order items, and product details
    const getOrderQuery = `
        SELECT 
            o.id AS order_id,
            DATE_FORMAT(o.created_at, '%Y-%m-%d') AS created_at,
            oi.id AS order_item_id,
            oi.product_id,
            oi.quantity,
            oi.price,
            p.name AS product_name,
            MIN(pi.img) AS product_image  -- Get the first image for each product
        FROM 
            orders o
        LEFT JOIN 
            order_items oi ON o.id = oi.order_id
        LEFT JOIN 
            product p ON oi.product_id = p.id
        LEFT JOIN 
            product_images pi ON p.id = pi.ProductID
        WHERE 
            o.user_id = ?
        GROUP BY 
            oi.id`;  // Group by order item ID to get unique order items

    db.query(getOrderQuery, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Group the results by order in a more performant way
        const orders = [];
        const orderMap = {};

        result.forEach(row => {
            const orderId = row.order_id;

            // Check if the order already exists in the map
            if (!orderMap[orderId]) {
                orderMap[orderId] = {
                    id: orderId,
                    created_at: row.created_at,
                    total_price: row.total_price,
                    items: [],
                };
                orders.push(orderMap[orderId]); // Push to orders array only once
            }

            // If there are associated order items, add them to the items array
            if (row.order_item_id) {
                orderMap[orderId].items.push({
                    id: row.order_item_id,
                    product_id: row.product_id,
                    quantity: row.quantity,
                    price: row.price,
                    product_name: row.product_name, // Add product name
                    product_image: row.product_image // Add the first product image
                });
            }
        });

        res.json(orders);
    });
}

// Confirm Payment Function
// const handleOrderStatusToConfirm = async (req, res) => {
//     const { order_id, status } = req.body;

//     if (!order_id || !status) {
//         return res.status(400).json({ error: "Order ID and status are required" });
//     }

//     try {
//         if (status === 'Confirmed') {
//             const updateOrderStatusQuery = `UPDATE orders SET order_status = 'Confirmed' WHERE id = ?`;
//             await db.promise().query(updateOrderStatusQuery, [order_id]);
//             return res.json({ message: "Order confirmed successfully" });
//         } else if (status === 'Rejected') {
//             await db.promise().query('START TRANSACTION');

//             const deleteOrderItemsQuery = `DELETE FROM order_items WHERE order_id = ?`;
//             await db.promise().query(deleteOrderItemsQuery, [order_id]);

//             const deleteOrderQuery = `DELETE FROM orders WHERE id = ?`;
//             await db.promise().query(deleteOrderQuery, [order_id]);

//             await db.promise().query('COMMIT');
//             return res.json({ message: "Order rejected and removed successfully" });
//         } else {
//             return res.status(400).json({ error: "Invalid status. Use 'Confirmed' or 'Rejected'." });
//         }
//     } catch (err) {
//         await db.promise().query('ROLLBACK');  // Rollback transaction in case of error
//         return res.status(500).json({ error: err.message });
//     }
// };
const handleOrderStatusToConfirm = async (req, res) => {
    const { order_id, status } = req.body;

    if (!order_id || !status) {
        return res.status(400).json({ error: "Order ID and status are required" });
    }

    try {
        if (status === 'Confirmed') {
            const updateOrderStatusQuery = `UPDATE orders SET order_status = 'Confirmed' WHERE id = ?`;
            await db.promise().query(updateOrderStatusQuery, [order_id]);
            return res.json({ message: "Order confirmed successfully" });
        } else if (status === 'Canceled') {
            const updateOrderStatusQuery = `UPDATE orders SET order_status = 'Canceled' WHERE id = ?`;
            await db.promise().query(updateOrderStatusQuery, [order_id]);
            return res.json({ message: "Order Canceled successfully" });
        } else {
            return res.status(400).json({ error: "Invalid status. Use 'Confirmed' or 'Canceled'." });
        }
    } catch (err) {
        await db.promise().query('ROLLBACK');  // Rollback transaction in case of error
        return res.status(500).json({ error: err.message });
    }
};
const getOrders = async (req, res) => {
    const getOrderQuery = `
        SELECT 
            o.id AS order_id,
            o.user_id,
            o.address_id,
            o.shipping_method,
            o.payment_method,
            o.total_price,
            o.order_status,
            DATE_FORMAT(o.created_at, '%Y-%m-%d') AS created_at,
            u.first_name,
            u.last_name,
            u.email,
            oi.id AS order_item_id,
            oi.product_id,
            oi.quantity,
            oi.size,
            oi.color,
            oi.price,
            oi.message,
            oi.wrap_type,
            oi.delivery_date,
            p.name AS product_name,
            a.address AS address,
            a.addressoptional AS addressoptional,
            a.city AS city, a.country AS country, a.phone AS phone
        FROM orders o
        LEFT JOIN login u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN product p ON oi.product_id = p.id
        LEFT JOIN useraddress a ON o.address_id = a.id
    `;

    try {
        db.query(getOrderQuery, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const orders = {};

            results.forEach(row => {
                const orderId = row.order_id;

                // Initialize order if not already done
                if (!orders[orderId]) {
                    orders[orderId] = {
                        order_id: orderId,
                        user_id: row.user_id,
                        address_id: row.address_id,
                        shipping_method: row.shipping_method,
                        payment_method: row.payment_method,
                        total_price: row.total_price,
                        order_status: row.order_status,
                        created_at: row.created_at,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        email: row.email,
                        address: row.address,
                        addressoptional: row.addressoptional,
                        city: row.city,
                        country: row.country,
                        phone: row.phone,
                        items: []
                    };
                }

                // Add item details if present
                if (row.order_item_id) {
                    orders[orderId].items.push({
                        order_item_id: row.order_item_id,
                        product_id: row.product_id,
                        quantity: row.quantity,
                        size: row.size,
                        color: row.color,
                        price: row.price,
                        message: row.message,
                        wrap_type: row.wrap_type,
                        delivery_date: row.delivery_date,
                        product_name: row.product_name
                    });
                }
            });

            // Send the response as an array
            res.json(Object.values(orders));
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




module.exports ={addOrder,getorderByUserId,handleOrderStatusToConfirm,getOrders}