const pg = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

const port = 3000;

const pool = new pg.Pool({
    user: 'secadv',
    host: 'db',
    database: 'pxldb',
    password: 'ilovesecurity',
    port: 5432,
    connectionTimeoutMillis: 5000
});

console.log("Connecting...:");

app.use(cors());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

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

// Vergelijk het ingevoerde wachtwoord met het gehashte wachtwoord in de database
const comparePassword = async (password, hashedPassword) => {
    return pool.query('SELECT $1 = $2 AS match', [hashedPassword, crypt(password, hashedPassword)])
        .then(result => result.rows[0].match);
};

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});