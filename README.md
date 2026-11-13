# 🎬 Netflix Clone – Full Stack Movie Streaming Platform

A full-stack Netflix-inspired movie streaming application built with React and Node.js. Explore movies, watch trailers, manage your personal watchlist, like your favorite movies, and securely manage your account with a complete authentication system.

The application integrates movie data from TMDB API and provides a personalized movie-browsing experience with a modern, responsive cinematic interface.

---

## 🚀 Live Demo

- **Frontend:** [Netflix Clone](https://himanshu-raj-uk.github.io/Netflix-Clone/)
- **Backend:** Add your deployed backend URL here.
- **GitHub Repository:** [Netflix Clone Repository](https://github.com/himanshu-raj-uk/Netflix-Clone)

---

## ✨ Features

### 🎥 Movie Browsing & Discovery
- Browse trending, popular and top-rated movies.
- Explore movies through dynamic categories.
- View movie posters, backdrops and descriptions.
- Watch movie trailers.
- Search for movies using TMDB API.
- Responsive movie cards and interactive hover effects.

### 🔐 Authentication & Account Management

Complete user authentication system powered by the backend.

**1. User Registration**
- Create a new account.
- Validate user information.
- Securely hash passwords using bcrypt.
- Store registered user information in MongoDB.

**2. User Login**
- Authenticate users using email and password.
- Compare passwords securely using bcrypt.
- Generate authentication tokens.
- Provide access to protected application features.

**3. Forgot Password**
- Request a password reset using the registered email.
- Generate a secure, time-limited reset token.
- Send a password reset link through email.

**4. Reset Password**
- Verify the password reset token.
- Validate the new password.
- Hash the new password using bcrypt.
- Update the password in MongoDB.
- Invalidate the reset token after successful use.

**5. OTP Verification**
- Verify user email through OTP.
- Handle OTP expiration and resend functionality.
- Validate verification requests on the backend.

**6. User Profile**
- Access personalized account information.
- Manage user account details.
- Maintain authentication state.

### ❤️ Like List
- Like your favorite movies.
- Save liked movies to your account.
- Retrieve your liked movies after login.
- Remove movies from your liked list.
- Maintain personalized movie preferences.

### 📌 Watchlist
- Add movies to your personal watchlist.
- Save watchlist data in MongoDB.
- Retrieve saved movies whenever you log in.
- Remove movies from your watchlist.
- Maintain your personal collection across sessions.

---

## 🔄 Application & Backend Flow

### 1. Registration Flow

```text
User
  |
  v
Registration Form
  |
  v
Frontend Validation
  |
  v
Backend Registration API
  |
  v
Validate User Data
  |
  v
Hash Password using bcrypt
  |
  v
Save User in MongoDB
  |
  v
Email / OTP Verification
  |
  v
Account Verified
```

### 2. Login Flow

```text
User
  |
  v
Login Form
  |
  v
Send Email & Password
  |
  v
Backend Login API
  |
  v
Find User in MongoDB
  |
  v
Compare Password using bcrypt
  |
  v
Generate Authentication Token
  |
  v
Authenticated User
  |
  v
Access Protected Features
```

### 3. Forgot & Reset Password Flow

```text
Forgot Password
      |
      v
Enter Registered Email
      |
      v
Backend Validates Email
      |
      v
Generate Secure Reset Token
      |
      v
Send Reset Link Through Email
      |
      v
User Opens Reset Link
      |
      v
Validate Reset Token & Expiry
      |
      v
Enter New Password
      |
      v
Hash Password using bcrypt
      |
      v
Update MongoDB
      |
      v
Password Successfully Reset
```

### 4. Watchlist Flow

```text
Authenticated User
       |
       v
Select Movie
       |
       v
Click Add to Watchlist
       |
       v
Frontend API Request
       |
       v
Backend Authentication
       |
       v
Update User Watchlist
       |
       v
Save in MongoDB
       |
       v
Display Saved Movies
```

### 5. Like List Flow

```text
Authenticated User
       |
       v
Click Like Button
       |
       v
Send Movie Data to Backend
       |
       v
Verify User Authentication
       |
       v
Update Like List in MongoDB
       |
       v
Display Liked Movies
```

---

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript (ES6+)
- Tailwind CSS
- Redux
- React Router DOM
- Axios
- Lucide React
- Motion
- TMDB API

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- Nodemailer
- dotenv
- CORS

### Development Tools
- Git & GitHub
- Vite
- VS Code
- Postman

---

## 📂 Project Structure

```text
Netflix Clone/
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── Components/
│   │   ├── Pages/
│   │   ├── Routes/
│   │   ├── Hook/
│   │   ├── Redux/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
└── README.md
```

*Note: The folder structure is illustrative. Adjust it to match your actual project.*

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB
- Git

### 1. Clone Repository

```bash
git clone https://github.com/himanshu-raj-uk/Netflix-Clone.git
cd Netflix-Clone
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env` file inside the Frontend folder:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

### 3. Backend Setup

Open another terminal:

```bash
cd Backend
npm install
```

Create a `.env` file inside the Backend folder:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

*Use the environment variable names expected by your existing backend configuration. Never commit actual API keys, passwords, or secrets.*

---

## 🔑 Environment Variables

| Variable | Purpose |
|---|---|
| VITE_TMDB_API_KEY | TMDB API access |
| VITE_API_URL | Backend API URL |
| PORT | Backend server port |
| MONGO_URI | MongoDB connection |
| JWT_SECRET | JWT signing secret |
| EMAIL_USER | Email sender account |
| EMAIL_PASS | Email application password |
| FRONTEND_URL | Frontend application URL |

---

## 🔒 Security Implementation

- Password hashing using bcrypt.
- JWT-based user authentication.
- Protected backend routes.
- Server-side input validation.
- Secure password reset workflow.
- Time-limited password reset tokens.
- Environment variables for sensitive configuration.
- User-specific watchlist and liked movies.

---

## 🌐 API Integration

The application uses TMDB (The Movie Database) API to retrieve movie information.

**TMDB API:** https://developer.themoviedb.org/

Movie data includes:
- Movie titles.
- Posters and backdrops.
- Descriptions.
- Ratings.
- Release dates.
- Trailers.
- Trending and popular categories.

---

## 📱 Responsive Design

Designed to provide a consistent experience across:

- Desktop computers.
- Laptops.
- Tablets.
- Mobile devices.

---

## 👨‍💻 Developer

**Himanshu Raj**

Full Stack Developer | React.js | Node.js | MongoDB

- **GitHub:** [himanshu-raj-uk](https://github.com/himanshu-raj-uk)

---

## 📄 Disclaimer

This project is created for educational and portfolio purposes. It is not affiliated with, endorsed by, or officially associated with Netflix.

Movie information and images are provided by TMDB.

---

⭐ If you find this project interesting, consider giving the repository a star!
