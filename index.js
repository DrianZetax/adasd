const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');

const app = express();

// Path ke folder database
const DATABASE_PATH = path.resolve("D:/CPP/fynxsrcs4.8/core/database/players");

app.use(
  compression({
    level: 9,
    threshold: 0,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true })
);

app.post('/player/login/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

app.all('/player/growid/login/validate', (req, res) => {
  const growId = req.body.growId;
  const password = req.body.password;

  if (!growId || !password) {
    return res.status(400).json({
      status: "error",
      message: "GrowID and Password are required.",
    });
  }

  try {
    // Baca semua file JSON di folder database
    const files = fs.readdirSync(DATABASE_PATH);

    for (const file of files) {
      const filePath = path.join(DATABASE_PATH, file);
      const playerData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (playerData.growId === growId && playerData.password === password) {
        // Buat token validasi
        const token = Buffer.from(
          `_token=${playerData.token}&growId=${growId}&password=${password}`
        ).toString('base64');

        return res.status(200).json({
          status: "success",
          message: "Account Validated.",
          token: token,
          url: "",
          accountType: "growtopia",
        });
      }
    }

    // Jika tidak ditemukan
    res.status(401).json({
      status: "error",
      message: "Invalid GrowID or Password.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error.",
    });
  }
});

app.post('/player/validate/close', function (req, res) {
  res.send('<script>window.close();</script>');
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(5000, function () {
  console.log('Listening on port 5000');
});
