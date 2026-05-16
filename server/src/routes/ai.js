const express = require('express');
const { chatWithCoach, parseReceipt, getChatHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/coach', protect, chatWithCoach);
router.post('/parse-receipt', protect, parseReceipt);
router.get('/history', protect, getChatHistory);

module.exports = router;
