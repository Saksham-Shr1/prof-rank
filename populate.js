const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

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

  // Path to the images directory
  const imagesDir = path.join(__dirname, 'public', 'images');

  // Read all images from the directory
  fs.readdir(imagesDir, (err, files) => {
    if (err) throw err;

    // Insert each image into the database
    files.forEach((file) => {
      const filePath = `images/${file}`;
      db.query('INSERT INTO professors (photo_path) VALUES (?)', [filePath], (err, result) => {
        if (err) throw err;
        console.log(`Inserted ${filePath} into the database`);
      });
    });

    // Close the database connection
    db.end();
  });
});
