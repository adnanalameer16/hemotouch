//connection to database
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors()); // Allow frontend to access API
app.use(express.json());
const port = 3000;


const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "hemotouchdb",
    password: "Ahil@335",
    port: 5432, // Default PostgreSQL port
  });


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });


  //API fetch donors data
  app.get("/donors", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM donors");
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

  //fetch pending table
  app.get("/pending", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM pending");
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
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



  //delete pending row
  app.delete("/pending/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM pending WHERE id = $1", [id]);
        res.json({ message: "Row deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Deletion failed" });
    }
});



// API to insert a new donor
app.post("/donors", async (req, res) => {
  const { name, age, bloodgp, diseases, phno, address} = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO donors (name, age, bloodgp, diseases, phno, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, age, bloodgp, diseases, phno, address]
    );
    res.status(201).json({ success: true, donor: result.rows[0] });
  } catch (error) {
    console.error("Error inserting donor:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }

});


// API to insert a new donor to donorslist
app.post("/donorslist", async (req, res) => {
  const { name, age, bloodgp, diseases, phno, address} = req.body;
  const hospital = "Aster Medicity";
  try {
    const result = await pool.query(
      "INSERT INTO donorslist (name, age, bloodgp, diseases, phno, address, hospital) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, age, bloodgp, diseases, phno, address, hospital]
    );
    res.status(201).json({ success: true, donor: result.rows[0] });
  } catch (error) {
    console.error("Error inserting donor:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }

});
     

//API insert a request
app.post("/pending", async (req, res) => {
  const { name, age, bloodgp, phno, address} = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO pending (name, age, bloodgp, phno, address) VALUES ($1, $2, $3, $4, $5 ) RETURNING *",
      [name, age, bloodgp, phno, address]
    );
    res.status(201).json({ success: true, donor: result.rows[0] });
  } catch (error) {
    console.error("Error inserting donor:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }

});


//API insert a emergency request
app.post("/pending/", async (req, res) => {
  const { name, age, bloodgp, phno, address} = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO pending (name, age, bloodgp, phno, address) VALUES ($1, $2, $3, $4, $5 ) RETURNING *",
      [name, age, bloodgp, phno, address]
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
  console.log("Route /donors was hit!"); 
  try {
      const { bloodgp } = req.query;
      console.log("Fetched Data:", bloodgp);
      const result = await pool.query(
          "SELECT name, age, bloodgp, diseases, phno, address, date_of_donation FROM donors WHERE TRIM(bloodgp) = $1",
          [bloodgp]
      );
      console.log("Fetched Data:", result.rows);

      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database query failed" });
  }
});



//fetch compatible bloodgp-request-emergency
app.get("/compatible_bgp/all/:bloodGroup", async (req, res) => {
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




//fetching donor details--compatible bgp -emergency req
app.get("/donorslist/all", async (req, res) => {
  console.log("Route /donors was hit!"); 
  try {
      const { bloodgp } = req.query;
      console.log("Fetched Data:", bloodgp);
      const result = await pool.query(
          "SELECT name, age, bloodgp, diseases, phno, address, hospital, date_of_donation FROM donorslist WHERE TRIM(bloodgp) = $1",
          [bloodgp]
      );
      console.log("Fetched Data:", result.rows);

      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database query failed" });
  }
});




//fetch compatible bloodgp-donate
app.get("/compatible_bgp_don/:bloodGroup", async (req, res) => {
  const { bloodGroup } = req.params;

  // Validate input to prevent SQL injection
  const allowedColumns = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (!allowedColumns.includes(bloodGroup)) {
      return res.status(400).json({ error: "Invalid blood group" });
  }

  try {
      const query = `SELECT "${bloodGroup}" FROM compatible_bgp_don WHERE "${bloodGroup}" IS NOT NULL`;
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



// API to book an appointment
// Function to get the next available date
const getNextAvailableDate = async () => {
  let availableDate = new Date();
  availableDate.setHours(0, 0, 0, 0); // Ensure the date is set to midnight

  while (true) {
    const res = await pool.query(
      "SELECT COUNT(*) FROM appointments WHERE appointment_date = $1",
      [availableDate.toISOString().split("T")[0]]
    );

    if (parseInt(res.rows[0].count) < 3) {
      return availableDate.toISOString().split("T")[0]; // Return as YYYY-MM-DD
    }
    availableDate.setDate(availableDate.getDate() + 1); // Move to the next day
  }
};




app.post("/appointments", async (req, res) => {
  const { name, age, bloodgp, phno, address} = req.body;


  /*if (!patient_name || !phone) {
    return res.status(400).json({ success: false, error: "Name and phone are required" });
  }*/

  try {
    const scheduledDate = await getNextAvailableDate();

    const result = await pool.query(
      "INSERT INTO appointments (name, age, bloodgp, phno, address, appointment_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, age, bloodgp, phno, address, scheduledDate]
    );

    res.status(201).json({ success: true, appointment: result.rows[0] });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});



//fetch appointment table
app.get("/appointments", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointments");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


//delete appointment row
app.delete("/appointments/:id", async (req, res) => {
  try {
      const { id } = req.params;
      await pool.query("DELETE FROM appointments WHERE id = $1", [id]);
      res.json({ message: "Row deleted successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Deletion failed" });
  }
});