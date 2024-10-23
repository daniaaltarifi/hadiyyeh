const db = require("../config.js");
const addAddress = async (req, res) => {
  const { user_id, address, addressoptional, city, country, phone } = req.body;
  const addAddressQuery = `INSERT INTO useraddress (user_id, address, addressoptional, city, country, phone) VALUES(?,?,?,?,?,?)`;
  db.query(
    addAddressQuery,
    [user_id, address, addressoptional, city, country, phone],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Address added successfully" });
    }
  );
};
const getAddress = async (req, res) => {
  const { user_id } = req.params;
  const getAddressQuery = `SELECT id, address, addressoptional, city, country, phone FROM useraddress WHERE user_id=?`;
  db.query(getAddressQuery, [user_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const updateAddress = async (req, res) => {
    const {id} = req.params // This should be the address ID, not user ID
    const { address, addressoptional, city, country, phone } = req.body;
    
    const updateAddressQuery = `
          UPDATE useraddress 
          SET address=?, addressoptional=?, city=?, country=?, phone=? 
          WHERE id=?
      `;
  
    db.query(
      updateAddressQuery,
      [address, addressoptional, city, country, phone, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error updating address" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }
  
        res.json({ message: "Address updated successfully" });
      }
    );
  };
  

module.exports = { addAddress, getAddress, updateAddress };
