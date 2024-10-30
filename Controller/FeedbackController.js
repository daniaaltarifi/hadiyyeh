const db = require("../config.js");
const addFeedback=async(req,res)=>{
    const { product_id, user_id, message,rating }=req.body;
    const addfeed=`INSERT INTO feedback(product_id, user_id, message, rating) VALUES(?,?,?,?)`
    db.query(addfeed,[product_id, user_id, message,rating],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json({message:"Feedback added  successfully"});
    });
}
const getFeedback = async (req, res) => {
    const getfeed = `
        SELECT 
            feedback.*, 
            p.name AS product_name, 
            MIN(pi.img) AS product_image,
            u.first_name AS first_name, 
            u.last_name AS last_name 
        FROM 
            feedback 
        LEFT JOIN 
            product AS p ON feedback.product_id = p.id
        LEFT JOIN
            product_images AS pi ON p.id = pi.productID  
        LEFT JOIN 
            login AS u ON feedback.user_id = u.id
        GROUP BY 
            feedback.id
    `;

    db.query(getfeed, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
};
const deleteFeedback = async (req, res) => {
    const { id } = req.params;
    const deletefeed = `DELETE FROM feedback WHERE id =?`;
    db.query(deletefeed, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Feedback deleted successfully" });
    });
}
module.exports = {addFeedback,getFeedback,deleteFeedback};