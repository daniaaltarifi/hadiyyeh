const db = require("../config.js");
const addWrapGift=async(req,res)=>{
    const {wrap_type, cost }=req.body;
    const img =
    req.files && req.files["img"] ? req.files["img"][0].filename : null;
    const addToCartQuery=`INSERT INTO wrapgift(wrap_type, cost, img) VALUES(?,?,?)`
    db.query(addToCartQuery,[wrap_type, cost, img],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json({message:"Gift wrap added  successfully"});
    });
 
}
const getWrapGift = async (req, res) => {
    const getWrapGiftQuery = `SELECT * FROM wrapgift`;
    db.query(getWrapGiftQuery, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };
  const getWrapGiftById = async (req, res) => {
    const { id } = req.params;
    const getWrapGiftByIdQuery = `SELECT * FROM wrapgift WHERE id =?`;
    db.query(getWrapGiftByIdQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) {
        return res.status(404).json({ message: "No matching record found" });
      }
      res.json(result[0]);
    });
  }
  const updateWrapGift = async (req, res) => {
    const { id } = req.params;
    const { wrap_type, cost } = req.body;
    const img =
      req.files && req.files["img"] ? req.files["img"][0].filename : null;
    // First, retrieve the current values
    const sqlSelect = "SELECT wrap_type, cost, img FROM wrapgift WHERE id = ?";
  
    db.query(sqlSelect, [id], (err, results) => {
      if (err) {
        console.error("Error fetching current data:", err);
        return res.status(500).json({ message: err.message });
      }
  
      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "No matching record found to update" });
      }
      const existing = results[0];
      // Update fields only if new values are provided
      const updatedwrap_type = wrap_type !== undefined ? wrap_type : existing.wrap_type;
      const updatedcost = cost !== undefined ? cost : existing.cost;
      const updatedImg = img !== null ? img : existing.img;
  
      const updateWrapGiftQuery = `UPDATE wrapgift SET wrap_type=?, cost=?, img=? WHERE id=?`;
      db.query(
        updateWrapGiftQuery,
        [updatedwrap_type, updatedcost, updatedImg, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Gift wrap updated successfully" });
        }
      );
    });
  };
  const deleteWrapGift = async (req, res) => {
    const { id } = req.params;
    const deleteWrapGiftQuery = `DELETE FROM wrapgift WHERE id=?`;
    db.query(deleteWrapGiftQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Gift wrap deleted successfully" });
    });
  };
module.exports={addWrapGift,getWrapGift,updateWrapGift,deleteWrapGift,getWrapGiftById}