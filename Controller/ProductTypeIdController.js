const db = require("../config.js");

const getwatchtype = async (req, res) => {
    const getWatchType = `SELECT * FROM watchtypes `;
    db.query(getWatchType, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };


  module.exports = {getwatchtype}

