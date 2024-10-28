const db = require("../config.js");

const getfragrancetypes = async (req, res) => {
    const getFragranceType = `SELECT * FROM fragrancetypes `;
    db.query(getFragranceType, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };


  module.exports = {getfragrancetypes}

