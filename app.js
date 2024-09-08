const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = 3005;

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Your MySQL password
  database: 'professors'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL Database');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to render the face-off page with two random professors
app.get('/', async (req, res) => {
  try {
    // Fetch professors from MySQL
    db.query('SELECT * FROM professors', (err, professors) => {
      if (err) throw err;

      // Shuffle and select two random professors for the face-off
      const shuffled = professors.sort(() => 0.5 - Math.random());
      const faceOffProfessors = shuffled.slice(0, 2);

      res.render('index', { faceOffProfessors });
    });
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).send('Error fetching professors.');
  }
});

// Route to handle voting during face-off
app.post('/vote/:winnerId/:loserId', (req, res) => {
  const winnerId = parseInt(req.params.winnerId, 10);
  const loserId = parseInt(req.params.loserId, 10);

  // Fetch current ratings from MySQL
  db.query('SELECT * FROM professors WHERE id IN (?, ?)', [winnerId, loserId], (err, results) => {
    if (err) throw err;

    const winner = results.find(prof => prof.id === winnerId);
    const loser = results.find(prof => prof.id === loserId);

    if (winner && loser) {
      const K = 32;
      const expectedWinner = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400));
      const newWinnerRating = winner.elo + K * (1 - expectedWinner);
      const newLoserRating = loser.elo - K * (1 - expectedWinner);

      // Update the database
      db.query('UPDATE professors SET votes = votes + 1, elo = ? WHERE id = ?', [Math.round(newWinnerRating), winnerId]);
      db.query('UPDATE professors SET elo = ? WHERE id = ?', [Math.round(newLoserRating), loserId]);

      res.redirect('/');
    }
  });
});

// Route to display rankings
app.get('/ranking', (req, res) => {
  db.query('SELECT * FROM professors ORDER BY elo DESC', (err, professors) => {
    if (err) throw err;
    res.render('ranking', { professors });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
