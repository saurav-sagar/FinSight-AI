const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Route files
const auth = require('./src/routes/auth');
const transactions = require('./src/routes/transactions');
const sheets = require('./src/routes/sheets');
const ai = require('./src/routes/ai');

// Ping route
app.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'pong' });
});

// Mount routers
app.use('/api/auth', auth);
app.use('/api/transactions', transactions);
app.use('/api/sheets', sheets);
app.use('/api/ai', ai);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
