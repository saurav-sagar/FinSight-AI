const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Message = require('../models/Message');
const axios = require('axios');

// @desc    Get chat history
// @route   GET /api/ai/history
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.find({ userId: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
      
    res.status(200).json({ 
      success: true, 
      data: messages.reverse(), 
      hasMore: messages.length === limit 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  }
};

// @desc    Chat with AI Coach using transaction data
// @route   POST /api/ai/coach
// @access  Private
exports.chatWithCoach = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Fetch user preferences
    const user = await User.findById(req.user.id);
    const { aiPersonality, financialGoal } = user;

    // Fetch the last 60 days of transactions for context
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: sixtyDaysAgo },
    }).sort('-date');

    // Format transaction data into a compact string
    const transactionContext = transactions
      .map(t => `Date: ${t.date.toISOString().split('T')[0]}, Amount: ${t.amount}, Type: ${t.type}, Category: ${t.category}, Title: ${t.title}`)
      .join('\n');

    let toneInstruction = 'Maintain a professional, encouraging, and highly competent tone. Be direct and concise without being overly conversational.';
    if (aiPersonality === 'Strict') toneInstruction = 'Adopt a strict, no-nonsense, and uncompromisingly honest tone. Hold the user accountable for poor spending habits and prioritize discipline.';
    if (aiPersonality === 'Analytical') toneInstruction = 'Adopt a highly analytical, objective, and corporate tone. Focus strictly on numerical data, percentages, statistical trends, and optimization strategies.';

    let goalInstruction = '';
    if (financialGoal) {
      goalInstruction = `CRITICAL DIRECTIVE: The user's primary financial goal is: "${financialGoal}". Every piece of advice you provide MUST mathematically and strategically align with achieving this specific goal.`;
    }

    const systemPrompt = `You are FinSight AI, an elite, professional-grade financial advisory AI.
Your purpose is to provide precise, actionable, and data-backed financial coaching based exclusively on the user's transaction history and stated goals.

RULES OF ENGAGEMENT:
1. PRECISION: Never give generic financial advice. Base your recommendations strictly on the provided transaction data.
2. FORMATTING: Use Markdown extensively. Utilize bolding for emphasis, bulleted lists for actionable steps, and clear headings to structure your analysis.
3. CONCISENESS: Get straight to the point. Avoid fluff, filler text, or overly conversational greetings.
4. TONE: ${toneInstruction}
${goalInstruction}

CONTEXT DATA (Last 60 Days of Transactions):
--------------------------------------------------
${transactionContext || 'No transaction data available for the last 60 days.'}
--------------------------------------------------

Process the user's inquiry based strictly on the data above and respond accordingly.`;

    // Save user message to DB
    await Message.create({
      userId: req.user.id,
      role: 'user',
      content: message
    });

    // Fetch the last 15 messages for context
    const recentMessages = await Message.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(15);
    
    // Reverse to chronological order
    const contextMessages = recentMessages.reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000', // Update for production
          'X-Title': 'FinSight AI',
        },
      }
    );

    const aiMessageContent = response.data.choices[0].message.content;

    // Save AI response to DB
    await Message.create({
      userId: req.user.id,
      role: 'assistant',
      content: aiMessageContent
    });

    res.status(200).json({
      success: true,
      data: aiMessageContent,
    });
  } catch (error) {
    console.error('OpenRouter API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Error communicating with AI service' });
  }
};

// @desc    Parse raw text receipt into structured JSON
// @route   POST /api/ai/parse-receipt
// @access  Private
exports.parseReceipt = async (req, res) => {
  try {
    const { receiptText } = req.body;

    if (!receiptText) {
      return res.status(400).json({ success: false, error: 'Receipt text is required' });
    }

    const systemPrompt = `You are a receipt parsing assistant. Extract the following information from the provided receipt text:
- title: A short string describing the purchase
- amount: The total numerical amount (positive number)
- category: One of ['Food', 'Utilities', 'Entertainment', 'Shopping', 'Transport', 'Health', 'Other']
- type: Always set to "expense"

Return ONLY a valid JSON object matching this structure: { "title": "...", "amount": ..., "category": "...", "type": "expense" }. Do not wrap it in markdown block quotes.`;

    // Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: receiptText },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    
    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      return res.status(500).json({ success: false, error: 'Failed to parse receipt data. Please try again.' });
    }

    // Optionally auto-save to DB, or just return to frontend for confirmation
    const newTransaction = await Transaction.create({
      userId: req.user.id,
      ...parsedData,
      isAiGenerated: true
    });

    res.status(201).json({
      success: true,
      data: newTransaction,
    });
  } catch (error) {
    console.error('Parse Receipt Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Error parsing receipt' });
  }
};
