const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const DATABASE_PATH = path.resolve("D:/CPP/fynxsrcs4.8/core/database/players");

app.use(compression({
    level: 9,
    threshold: 0,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Route untuk membuka dashboard setelah login
app.post('/player/login/dashboard', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

// Route untuk validasi login
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
        // Membaca data pemain dari folder database
        const playerPath = path.join(DATABASE_PATH, `${growId}_.json`);

        if (!fs.existsSync(playerPath)) {
            return res.status(404).json({
                status: "error",
                message: "Player not found.",
            });
        }

        // Membaca file JSON pemain
        const playerData = JSON.parse(fs.readFileSync(playerPath, 'utf-8'));

        // Validasi password
        if (playerData.pass === password) {
            // Jika login berhasil, buat token validasi
            const token = Buffer.from(`${growId}:${password}`).toString('base64');

            return res.status(200).json({
                status: "success",
                message: "Account Validated.",
                token: token,
                url: "",
                accountType: "growtopia",
            });
        } else {
            return res.status(401).json({
                status: "error",
                message: "Invalid password.",
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Server error occurred.",
        });
    }
});

// Route untuk menutup jendela setelah validasi
app.post('/player/validate/close', function (req, res) {
    res.send('<script>window.close();</script>');
});

// Route utama
app.get('/', function (req, res) {
    res.send('Hello World!');
});

// Menjalankan server pada port 5000
app.listen(5000, function () {
    console.log('Listening on port 5000');
});
