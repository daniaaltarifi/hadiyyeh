const db = require("../config.js");

const getbagtype = async (req, res) => {
    const getbagtype = `SELECT * FROM bagtypes `;
    db.query(getbagtype, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };


  module.exports = {getbagtype}