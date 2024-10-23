const express = require('express');
const dotenv=require('dotenv')
dotenv.config();
const mysql2 = require('mysql2');
const db = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
  // Optionally, you can test the pool by connecting and querying the database
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to the database:", err);
    } else {
      console.log("Connected to the database");
  
      // Execute a test query
      connection.query("SELECT 1 + 1 AS result", (error, results) => {
        if (error) {
          console.error("Error executing query:", error);
        } else {
          console.log("Result:", results[0].result);
        }
        // Release the connection back to the pool
        connection.release();
      });
    }
  });
module.exports=db