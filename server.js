require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "prismpay",
    password: "Srm@7319",
    port: 5432,
});

pool.connect()
    .then(() => console.log("PostgreSQL Connected"))
    .catch(err => console.error("DB Connection Error:", err));

app.listen(5000, () => console.log("Server running on port 5000"));

//streak system
app.post("/update-streak/:id", async (req, res) => {
    const userId = req.params.id;
    const today = new Date().toISOString().split("T")[0];

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) return res.status(404).send("User not found");

    const lastLogin = result.rows[0].last_login;
    
    if (lastLogin === today) {
        return res.json({ message: "Already logged in today." });
    }

    await pool.query("UPDATE users SET streak = streak + 1, last_login = $2 WHERE id = $1", [userId, today]);
    
    res.json({ message: "Streak updated" });
});

//user creation endpoint
app.post("/users", async (req, res) => {
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required." });
    }

    try {
        const result = await pool.query(
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
            [name, email]
        );
        res.status(201).json(result.rows[0]); // Return the created user
    } catch (err) {
        if (err.code === '23505') { // Unique violation error code
            return res.status(409).json({ message: "Email already exists." });
        }
        console.error("Error creating user:", err);
        res.status(500).json({ message: "Error creating user." });
    }
});
