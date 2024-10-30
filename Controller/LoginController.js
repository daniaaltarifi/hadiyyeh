const db = require("../config.js");
const dotenv = require("dotenv");
dotenv.config(".env");
const SECRETTOKEN = process.env.SECRETTOKEN;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const saltRounds = 10; // Define your salt rounds
const signUp = async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      // Insert new user into the database
      const insertSql = "INSERT INTO login (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)";
      const values = [first_name, last_name, email, hashedPassword, role || 'user']; // Default role is 'user'
  
      db.query(insertSql, values, (err, result) => {
        if (err) {          
          // Check for duplicate entry error
          if (err.code === 'ER_DUP_ENTRY') {
            return res.json({ message: "Email already exists" });
          }
          
          return res.json({ message: "Inserting data error in server" });
        }
        return res.json({ message: "SignUp Success" });
      });
    } catch (error) {
      console.error(error);
      return res.json({ message: "Internal server error" });
    }
  };
  
  
const login = async (req, res) => {
  const sql = "SELECT * FROM login WHERE email = ? ";
  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      return res.json({ Error: "Login error in server" });
    }
    if (data.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        data[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "Password compare error" });
          if (response) {
            const {id, first_name, last_name, role } = data[0];
            const token = jwt.sign({ first_name, last_name,role}, SECRETTOKEN, { expiresIn: "1d" });
          // Set the token in a cookie
          res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
            sameSite: "Strict",
          });          
            return res.json({ Status: "Login Succses",token,user: {id, first_name, last_name, role, email: req.body.email }  });
          } else {
            return res.json({ Status: "Failed", Error: "Incorect Password" });
          }
        }
      );
    } else {
      return res.json({ message: "Email Not Found", Error: "No email exists" });
    }
  });
};
const logout = async (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.json({ Status: "Logout Success" });
  };
  
  const getUserById = async (req, res) => {
    const {id}=req.params
    const sqlget="SELECT id, first_name, last_name, email, balance FROM login WHERE id = ?";
    db.query(sqlget,[id], (err, data) => {
      if (err) {
        return res.json({ Error: "Fetching data error in server" });
      }
      res.json(data);
    })
  }
  const getAllUser = async (req, res) => {
    const sqlget="SELECT id, first_name, last_name, email, role, balance, created_at FROM login";
    db.query(sqlget,(err, data) => {
      if (err) {
        return res.json({ Error: "Fetching data error in server" });
      }
      res.json(data);
    })
  }
const updateUser = async (req, res) => {
  const {id}=req.params;
  const {balance}=req.body;
  const updateSql = "UPDATE login SET balance =? WHERE id =?";
  db.query(updateSql, [balance, id], (err, result) => {
    if (err) {
      console.error("Error updating data:", err);
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json({ message: "User Updated successfully" });
  });
}
  const deleteUser = async (req, res) => {
    const { id } = req.params;
    const sqlDelete = "DELETE FROM login WHERE id =?";
    db.query(sqlDelete, [id], (err, result) => {
      if (err) {
        console.error("Error deleting data:", err);
        return res.status(500).json({ message: err.message });
      }
      res.status(200).json({ message: "User Deleted successfully" });
    });
  }
module.exports = { signUp, login, logout, getUserById,getAllUser,updateUser,deleteUser };
