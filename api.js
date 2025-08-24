const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(cors()); // Allow frontend to access API
app.use(express.json());
const port = process.env.API_PORT || 3000;


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  //API fetch donors-list data
  app.get("/donorslist", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM donorslist");
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

// API to insert a new donor to donorslist
app.post("/all/donorslist", async (req, res) => {
  const { name, age, bloodgp, diseases, phno, address} = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO donorslist (name, age, bloodgp, diseases, phno, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, age, bloodgp, diseases, phno, address]
    );
    res.status(201).json({ success: true, donor: result.rows[0] });
  } catch (error) {
    console.error("Error inserting donor:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }

});

  //fetch compatible bloodgp-request
  app.get("/compatible_bgp/:bloodGroup", async (req, res) => {
    const { bloodGroup } = req.params;

    // Validate input to prevent SQL injection
    const allowedColumns = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!allowedColumns.includes(bloodGroup)) {
        return res.status(400).json({ error: "Invalid blood group" });
    }

    try {
        const query = `SELECT "${bloodGroup}" FROM compatible_bgp WHERE "${bloodGroup}" IS NOT NULL`;
        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No compatible blood groups found" });
        }

        // Extracting non-null values
        const compatibleBloodGroups = result.rows.map(row => row[bloodGroup]);

        res.json(compatibleBloodGroups);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//fetching donor details--compatible bgp req
app.get("/donors/all", async (req, res) => {
  try {
      const { bloodgp } = req.query;
      const result = await pool.query(
          "SELECT name, age, bloodgp, diseases, phno, address FROM donorslist WHERE TRIM(bloodgp) = $1",
          [bloodgp]
      );
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database query failed" });
  }
});


//blood quantity- hospital inventory-req
app.get("/api/blood_quantity", async (req, res) => {
  try {
      const result = await pool.query(
          "SELECT bloodgp, quantity FROM blood_quantity"
      );
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

//decrement blood quantity
app.post('/all/blood_quantity', async (req, res) => {
  const { bloodgp } = req.body;

  if (!bloodgp) {
      return res.status(400).json({ error: 'Blood group is required' });
  }

  try {
      await pool.query(
          `UPDATE blood_quantity SET quantity = GREATEST(quantity - 1, 0) WHERE bloodgp = $1;`, 
          [bloodgp]
      );

      //res.json({ message: 'Blood quantity decremented successfully' });
  } catch (error) {
      console.error('Error decrementing blood quantity:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});