const db = require("../config.js");
const addslider=async(req,res)=>{
    const {title, subtitle, link_to }=req.body;
    const img =
    req.files && req.files["img"] ? req.files["img"][0].filename : null;
    const addToCartQuery=`INSERT INTO slider(title, subtitle, link_to, img) VALUES(?,?,?,?)`
    db.query(addToCartQuery,[title, subtitle, link_to, img],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json({message:"Slider added  successfully"});
    });
 
}
const getslider = async (req, res) => {
    const getsliderQuery = `SELECT * FROM slider`;
    db.query(getsliderQuery, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };
  const updateslider = async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, link_to } = req.body;
    const img =
      req.files && req.files["img"] ? req.files["img"][0].filename : null;
    // First, retrieve the current values
    const sqlSelect = "SELECT title, subtitle, link_to, img FROM slider WHERE id = ?";
  
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
      const updatedtitle = title !== undefined ? title : existing.title;
      const updatedsubtitle = subtitle !== undefined ? subtitle : existing.subtitle;
      const updatedLink_to = link_to !== undefined ? link_to : existing.link_to;
      const updatedImg = img !== null ? img : existing.img;
  
      const updatesliderQuery = `UPDATE slider SET title=?, subtitle=?, link_to=?, img=? WHERE id=?`;
      db.query(
        updatesliderQuery,
        [updatedtitle, updatedsubtitle, updatedLink_to, updatedImg, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Slider updated successfully" });
        }
      );
    });
  };
  const deleteslider = async (req, res) => {
    const { id } = req.params;
    const deletesliderQuery = `DELETE FROM slider WHERE id=?`;
    db.query(deletesliderQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Slider deleted successfully" });
    });
  };
  const getSliderById = async (req, res) => {
    const { id } = req.params;
    const getSliderQuery = `SELECT * FROM slider WHERE id=?`;
    db.query(getSliderQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });

  }
module.exports={addslider,getslider,updateslider,deleteslider,getSliderById}