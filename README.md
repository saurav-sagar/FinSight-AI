# FinSight AI

**FinSight AI** is a modern, full-stack, AI-powered personal financial management platform. It leverages the MERN stack (MongoDB, Express, React, Node.js) alongside OpenRouter to provide intelligent financial coaching, dynamic transaction tracking, and interactive analytics.

---

## 🌟 Key Features

*   **AI Financial Coach**: An interactive chat interface powered by OpenRouter. It remembers conversation history (with infinite scroll pagination) and analyzes recent transactions to provide persona-driven, goal-oriented financial advice.
*   **Intelligent Ledger**: Manage income and expenses manually, or use the **Bulk Import** feature to upload bank statements via CSV. You can also export your ledger at any time.
*   **Interactive Analytics**: Visual breakdowns of your financial health, including Income vs. Expenses charts and Categorical Spending donuts using Recharts.
*   **Robust Authentication**: Secure JWT-based authentication, complete with a production-ready **Forgot Password / Reset Password** workflow utilizing time-sensitive hashed tokens and Nodemailer.
*   **Customizable User Profiles**: Users can upload avatars (powered by Cloudinary), choose their primary currency (USD, EUR, INR), set monthly budget cycle start dates, and select a dedicated AI personality (Gentle, Strict, Analytical).

---

## 🛠️ Technology Stack

**Frontend (Client)**
*   **React 19** & **Vite**: For a fast, modern component-based architecture.
*   **TailwindCSS v4**: For beautiful, responsive, and maintainable utility-first styling.
*   **React Router v7**: For declarative client-side routing.
*   **Recharts**: For dynamic SVG-based data visualization.
*   **React Markdown**: To parse and stylishly render AI-generated markdown responses.
*   **Lucide React**: For clean, modern iconography.

**Backend (Server)**
*   **Node.js & Express**: Handling robust RESTful API routing and middleware.
*   **MongoDB & Mongoose**: Flexible document-based data persistence.
*   **JSON Web Tokens (JWT)**: For secure, stateless user sessions.
*   **Bcrypt & Crypto**: For password hashing and secure reset token generation.
*   **Cloudinary & Multer**: For intercepting and uploading user avatars directly to the cloud.
*   **Nodemailer**: For sending secure password reset emails.
*   **OpenRouter API**: To connect to state-of-the-art LLMs for the AI Coaching feature.

---

## 📂 Project Structure

The repository is organized into a standard full-stack monorepo structure:

```text
FinSight-AI/
├── client/                     # React/Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (Layout, Sidebar)
│   │   ├── pages/              # Route views (Dashboard, AiCoach, Analytics)
│   │   ├── utils/              # Axios API interceptor configurations
│   │   ├── index.css           # Global Tailwind & Custom Scrollbar styles
│   │   └── App.jsx             # Main routing & Auth wrapper
│   └── package.json
└── server/                     # Node/Express Backend
    ├── src/
    │   ├── config/             # DB connection logic
    │   ├── controllers/        # Business logic for all routes
    │   ├── middleware/         # JWT protection & Error handlers
    │   ├── models/             # Mongoose schemas (User, Transaction, Message)
    │   ├── routes/             # Express route definitions
    │   └── utils/              # Helper functions (Nodemailer)
    ├── server.js               # Entry point
    └── package.json
```

---

## 📡 API Routes

### Authentication (`/api/auth`)
*   `POST /register` - Creates a new user account.
*   `POST /login` - Authenticates user and returns JWT.
*   `GET /me` - Fetches the currently authenticated user's profile.
*   `POST /avatar` - Uploads an image to Cloudinary and updates the user profile.
*   `POST /forgot-password` - Generates a reset token and emails a secure link.
*   `PUT /reset-password/:token` - Verifies the token and updates the password.
*   `PUT /update-profile` - Updates user preferences (AI persona, currency, goals).

### Transactions (`/api/transactions`)
*   `GET /` - Fetches all transactions for the authenticated user.
*   `POST /` - Creates a new manual transaction.
*   `DELETE /:id` - Deletes a specific transaction.

### CSV Sheets (`/api/sheets`)
*   `POST /import` - Parses an uploaded CSV file and bulk-inserts transactions.
*   `GET /export` - Generates and returns a CSV file of the user's ledger.

### AI Coach (`/api/ai`)
*   `POST /coach` - Sends a user message to OpenRouter, injecting transaction context and previous chat history into the system prompt.
*   `GET /history` - Fetches the user's chat history (supports `?limit` and `?skip` for infinite scroll).
*   `POST /parse-receipt` - (Upcoming) Analyzes receipt images to extract transaction data.

---

## 🔄 Core Workflows

### 1. The Secure Password Reset
1. User requests a reset by entering their email.
2. Backend generates a cryptographic `resetPasswordToken` and sets a 1-hour expiration date in the database.
3. Nodemailer sends an email to the user with a frontend URL containing the unhashed token.
4. User clicks the link, enters a new password, and the backend verifies the token before hashing the new password.

### 2. AI Coach Context Injection
When a user asks the AI Coach a question, the backend does not just forward the text. It actively compiles:
1. The user's AI persona preference (e.g., Strict vs. Analytical).
2. The user's primary financial goal.
3. A compressed string of their last 60 days of transactions.
4. The last 15 messages from their `Message` database collection to maintain conversational memory.
This compiled super-prompt is then sent to OpenRouter to ensure highly personalized, mathematically accurate advice.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)
*   Cloudinary Account (For avatars)
*   OpenRouter API Key (For AI)

### 1. Clone the repository
```bash
git clone https://github.com/saurav-sagar/FinSight-AI.git
cd FinSight-AI
```

### 2. Environment Variables

**Server (`server/.env`)**
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_super_secret_jwt_key
OPENROUTER_API_KEY=your_openrouter_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Client (`client/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation & Running Locally

Install dependencies for both client and server:
```bash
# In the server directory
cd server
npm install
npm run dev

# In a new terminal, navigate to the client directory
cd client
npm install
npm run dev
```

The application will be running at `http://localhost:5173`.
