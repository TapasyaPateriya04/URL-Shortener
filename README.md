# 📎 Mini URL Shortener

A full-stack URL shortener app that allows users to shorten long URLs and optionally set an expiry date. Built with:

- **Frontend**: React, Vite, Tailwind CSS, Axios  
- **Backend**: Node.js, Express.js, MongoDB  
- **Key Features**: URL validation, expiry logic, click tracking, and copyable shortened URL
---

## ⚙️ Setup Instructions

### 📦 Backend Setup (Node + Express)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
Install dependencies:

bash
Copy code
npm install
Create a .env file:

env
Copy code
PORT=5000
MONGO_URI=mongodb://localhost:27017/urlShortener
BASE_URL=http://localhost:5000
Start the server:

bash
Copy code
node index.js
# or with nodemon
npx nodemon index.js
🖼️ Frontend Setup (React + Vite)
Navigate to the frontend folder:

bash
Copy code
cd ../frontend
Install dependencies:

bash
Copy code
npm install
Start the Vite development server:

bash
Copy code
npm run dev