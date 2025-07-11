# 📎 Mini URL Shortener

A full-stack URL shortener app that allows users to shorten long URLs and optionally set an expiry date. Built with:

- **Frontend**: React, Vite, Axios  
- **Backend**: Node.js, Express.js, MongoDB  
- **Key Features**: URL validation, expiry logic, click tracking, and copyable shortened URL

---

## ⚙️ Setup Instructions

### 📦 Backend Setup (Node + Express)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file**:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/urlShortener
   BASE_URL=http://localhost:5000
   ```

4. **Start the server**:
   ```bash
   node index.js
   
   ```

---

### 🖼️ Frontend Setup (React + Vite)

1. **Navigate to the frontend folder**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```



---

## 💡 Features

- 🔗 Shorten long URLs instantly  
- 🕒 Set optional expiry dates for URLs  
- 📈 Tracks how many times a shortened URL has been clicked  
- ❌ Expired URLs return `410 Gone`  
- 🔐 Validates URLs using `valid-url`  
- 📋 Copy-to-clipboard feature for shortened URLs  

---

## 🛠️ Tech Stack

| Frontend       | Backend      | Database   |
|----------------|--------------|------------|
| React + Vite   | Express.js   | MongoDB    |
|   Axios        | Mongoose     |            |
|                | valid-url    |            |

---

## 🔍 Example `.env` File

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/urlShortener
BASE_URL=http://localhost:5000
```
