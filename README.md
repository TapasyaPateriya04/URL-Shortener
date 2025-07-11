📎 Mini URL Shortener
A full-stack URL shortener app that allows users to shorten long URLs and optionally set an expiry date. Built with:

Frontend: React, Vite, Axios

Backend: Node.js, Express.js, MongoDB

Features: URL validation, expiry logic, click tracking, copyable shortened URL

🗂️ Folder Structure
bash
Copy code
URL-Shortener/
├── backend/               # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   └── index.js
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
⚙️ Setup Instructions
📦 Backend Setup (Node + Express)
Navigate to backend folder:

bash
Copy code
cd backend
Install dependencies:

bash
Copy code
npm install
Set environment variables in .env:

env
Copy code
PORT=5000
MONGO_URI=mongodb://localhost:27017/urlShortener
BASE_URL=http://localhost:5000
Start server:

bash
Copy code
node index.js
# or with nodemon:
npx nodemon index.js
🖼️ Frontend Setup (React + Vite)
Navigate to frontend folder:

bash
Copy code
cd ../frontend
Install dependencies:

bash
Copy code
npm install
Start Vite dev server:

bash
Copy code
npm run dev
Open http://localhost:5173 in your browser.

💡 Features
🔗 Enter a long URL and get a shortened version

🕒 Optional expiry date for each short URL

📈 Click tracking stored in the database

❌ Expired URLs return 410 Gone

🔐 URL validation (using valid-url)

📋 Copy shortened URL button in UI

🛠️ Tech Stack
Frontend	Backend	Database
React + Vite	Express.js	MongoDB
Tailwind CSS	Mongoose	
Axios	valid-url	

🔍 Example .env File
env
Copy code
PORT=5000
MONGO_URI=mongodb://localhost:27017/urlShortener
BASE_URL=http://localhost:5000
