const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Create SQLite database and table
const db = new sqlite3.Database('user_data.db');
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, age INTEGER, dob DATE)');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Display the form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle form submission
app.post('/submit', (req, res) => {
  const { name, email, age, dob } = req.body;

  // Client-side validation
  if (!validateEmail(email) || !validateAge(age)) {
    res.send('Invalid input. Please check your email and age.');
    return;
  }

  // Check for duplicate email
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return console.error(err.message);
    }

    if (row) {
      res.send('Email is already in use. Please use a different email.');
    } else {
      // Insert data into the database
      db.run('INSERT INTO users (name, email, age, dob) VALUES (?, ?, ?, ?)', [name, email, age, dob], (err) => {
        if (err) {
          return console.error(err.message);
        }
        res.redirect('/display');
      });
    }
  });
});

// Display user data in a table
app.get('/display', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.send(renderTable(rows));
  });
});

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateAge(age) {
  return !isNaN(age) && parseInt(age) > 0;
}

function renderTable(rows) {
  let table = '<table border="1"><tr><th>ID</th><th>Name</th><th>Email</th><th>Age</th><th>Date of Birth</th></tr>';
  rows.forEach(row => {
    table += `<tr><td>${row.id}</td><td>${row.name}</td><td>${row.email}</td><td>${row.age}</td><td>${row.dob}</td></tr>`;
  });
  table += '</table>';
  return table;
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});