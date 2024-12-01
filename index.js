const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');

const app = express();

// Middleware untuk kompresi
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

// Middleware untuk CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware lainnya
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Endpoint untuk membaca semua file JSON di folder database/players
app.get('/players', (req, res) => {
    const directoryPath = path.join(__dirname, 'database/players');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Unable to scan directory', error: err });
        }

        const jsonFiles = files.filter(file => file.endsWith('_.json'));
        const players = [];

        jsonFiles.forEach(file => {
            const filePath = path.join(directoryPath, file);
            const data = fs.readFileSync(filePath, 'utf8');
            try {
                players.push(JSON.parse(data));
            } catch (error) {
                console.error(`Failed to parse ${file}:`, error);
            }
        });

        res.json(players);
    });
});

// Endpoint untuk membaca satu file JSON berdasarkan nama file
app.get('/players/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'database/players', filename);

    if (!filename.endsWith('_.json')) {
        return res.status(400).json({ status: 'error', message: 'Invalid file type. Only JSON files are allowed.' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ status: 'error', message: 'File not found', error: err });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Failed to parse JSON', error });
        }
    });
});

// Endpoint default
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
