const express = require('express');
const multer = require('multer');
const { exportTransactions, importTransactions } = require('../controllers/sheetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Setup multer for file uploads (store in memory or temp dir)
const upload = multer({ dest: 'uploads/' });

router.use(protect);

router.get('/export', exportTransactions);
router.post('/import', upload.single('file'), importTransactions);

module.exports = router;
