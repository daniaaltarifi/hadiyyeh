const db = require("../config.js");
const addGiftCard = async (req, res) => {
  const { title, amount } = req.body;
  const img =
    req.files && req.files["img"] ? req.files["img"][0].filename : null;
  const addGiftCardQuery = `INSERT INTO giftcard(title, amount, img) VALUES(?, ?, ?)`;
  db.query(addGiftCardQuery, [title, amount, img], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Gift Card added successfully" });
  });
};
const getGiftCard = async (req, res) => {
  const getGiftCardQuery = `SELECT * FROM giftcard`;
  db.query(getGiftCardQuery, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};
const updateGiftCard = async (req, res) => {
  const { id } = req.params;
  const { title, amount } = req.body;
  const img =
    req.files && req.files["img"] ? req.files["img"][0].filename : null;
  // First, retrieve the current values
  const sqlSelect = "SELECT title, amount, img FROM giftcard WHERE id = ?";

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

    // Get existing values
    const existing = results[0];

    // Update fields only if new values are provided
    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedamount = amount !== undefined ? amount : existing.amount;
    const updatedImg = img !== null ? img : existing.img;

    const updateGiftCardQuery = `UPDATE giftcard SET title=?, amount=?, img=? WHERE id=?`;
    db.query(
      updateGiftCardQuery,
      [updatedTitle, updatedamount, updatedImg, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Gift Card updated successfully" });
      }
    );
  });
};
const deleteGiftCard = async (req, res) => {
  const { id } = req.params;
  const deleteGiftCardQuery = `DELETE FROM giftcard WHERE id=?`;
  db.query(deleteGiftCardQuery, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Gift Card deleted successfully" });
  });
};
const getGiftCardById = async (req, res) => {
    const { id } = req.params;
    const getGiftCardQuery = `SELECT * FROM giftcard WHERE id=?`;
    db.query(getGiftCardQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    });
  };

module.exports = { addGiftCard, getGiftCard, updateGiftCard, deleteGiftCard,getGiftCardById };
