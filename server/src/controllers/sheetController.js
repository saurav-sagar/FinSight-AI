const Transaction = require('../models/Transaction');
const csvParser = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');

// @desc    Export transactions to CSV
// @route   GET /api/sheets/export
// @access  Private
exports.exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort('-date');

    const fields = ['title', 'amount', 'type', 'category', 'date', 'notes'];
    const json2csvParser = new Parser({ fields });
    
    // Convert dates to locale strings for readability
    const dataForCsv = transactions.map(t => ({
      ...t._doc,
      date: t.date ? t.date.toISOString().split('T')[0] : ''
    }));

    const csv = json2csvParser.parse(dataForCsv);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Import transactions from CSV
// @route   POST /api/sheets/import
// @access  Private
exports.importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a CSV file' });
    }

    const results = [];
    
    // Read the uploaded file
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        // Map CSV headers to schema
        results.push({
          userId: req.user.id,
          title: data.title || 'Imported Transaction',
          amount: parseFloat(data.amount) || 0,
          type: data.type?.toLowerCase() === 'income' ? 'income' : 'expense',
          category: data.category || 'Other',
          date: data.date ? new Date(data.date) : new Date(),
          notes: data.notes || ''
        });
      })
      .on('end', async () => {
        try {
          // Bulk insert
          await Transaction.insertMany(results);
          
          // Delete temp file
          fs.unlinkSync(req.file.path);

          res.status(201).json({
            success: true,
            count: results.length,
            message: 'Transactions imported successfully'
          });
        } catch (dbError) {
          res.status(500).json({ success: false, error: 'Error saving transactions to database' });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
