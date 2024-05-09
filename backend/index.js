const pg = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors middleware
const app = express();
const port = 3000;

// Configure CORS to allow requests only from http://localhost:8080
const corsOptions = {
    origin: 'http://localhost:8080',
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Database configuration using environment variables
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: 'db',
    database: 'pxldb',
    password: process.env.DB_PASSWORD,
    port: 5432,
    connectionTimeoutMillis: 5000
});

// Your existing authentication logic
app.post('/authenticate', async (request, response) => {
    const { username, password } = request.body;

    const query = 'SELECT password FROM users WHERE user_name = $1';
    const values = [username];

    pool.query(query, values, async (error, result) => {
        if (error) {
            throw error;
        }

        if (result.rows.length === 0) {
            return response.status(401).send('Invalid username or password.');
        }

        const hashedPassword = result.rows[0].password;
        const isValidPassword = await comparePassword(password, hashedPassword);

        if (isValidPassword) {
            response.status(200).send('Authentication successful.');
        } else {
            response.status(401).send('Invalid username or password.');
        }
    });
});

// Compare the entered password with the hashed password in the database
const comparePassword = async (password, hashedPassword) => {
    return pool.query('SELECT $1 = $2 AS match', [hashedPassword, crypt(password, hashedPassword)])
        .then(result => result.rows[0].match);
};

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});
