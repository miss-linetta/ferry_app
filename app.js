const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection configuration
const client = new Client({
  user: 'admin',
  host: 'localhost',
  database: 'ferry',
  password: 'success',
  port: 5432,
});

// Connect to PostgreSQL
client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Error connecting to PostgreSQL', err));

// Set EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Route to redirect to the navigation page
app.get('/', (req, res) => {
  res.redirect('/navigation');
});

// Route to render the navigation page
app.get('/navigation', async (req, res) => {
  res.render('navigation');
});

// Route to render the page with tables
app.get('/tables', async (req, res) => {
  try {
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    const tables = result.rows.map(row => row.table_name);
    res.render('tables', { tables });
  } catch (err) {
    console.error('Error fetching tables', err);
    res.status(500).send('Error fetching tables');
  }
});

// Route to render the page for adding a new record
app.get('/addRecord', async (req, res) => {
  try {
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    const tables = result.rows.map(row => row.table_name);
    res.render('addRecord', { tables });
  } catch (err) {
    console.error('Error fetching tables', err);
    res.status(500).send('Error fetching tables');
  }
});

// Route to fetch and display data from any table
app.get('/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const { rows } = await client.query(`SELECT * FROM ${tableName}`);
    res.render('table', { tableName, rows });
  } catch (err) {
    console.error(`Error fetching data from ${tableName} table`, err);
    res.status(500).send(`Error fetching data from ${tableName} table`);
  }
});
// Route to handle form submission for adding a new record
app.post('/addRecord', async (req, res) => {
  // Extract tableName and columns from req.body
  const { tableName, ...columns } = req.body;


  try {
    // Construct the SQL query dynamically based on the table name and column data
    const columnNames = Object.keys(columns).join(', ');
    const values = Object.values(columns);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) RETURNING *`;

    // Execute the query to insert the new record
    const result = await client.query(query, values);
    const newRecord = result.rows[0];

    // Redirect the user to the added record page or any other appropriate page
    res.redirect(`/addRecord/${tableName}`);
  } catch (err) {
    console.error(`Error adding new record to ${tableName} table`, err);
    res.status(500).send(`Error adding new record to ${tableName} table`);
  }
});


// Route to handle AJAX request to fetch columns for a specific table
app.get('/fetchColumns/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const result = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}'`);
    const columns = result.rows.map(row => row.column_name);
    res.json({ columns });
  } catch (err) {
    console.error(`Error fetching columns for ${tableName}`, err);
    res.status(500).send(`Error fetching columns for ${tableName}`);
  }
});

// Route to delete a passenger from the database
app.delete('/passenger/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('DELETE FROM passenger WHERE id = $1', [id]);
    res.json({ message: 'Passenger deleted successfully' });
  } catch (err) {
    console.error('Error deleting passenger', err);
    res.status(500).json({ error: 'Error deleting passenger' });
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;