# Peacock India Notes App

A full-stack notes application built with **Hono.js** that allows users to **signup, login, create, read, update, and delete notes**. The app also integrates **OpenAI API** to enhance note-taking with AI features.

---

## Features

- **User Authentication**
  - Signup and login functionality.
  - Password hashing and secure authentication.
  
- **Notes CRUD**
  - Create, read, update, and delete notes.
  - Notes are linked to authenticated users.

- **OpenAI Integration**
  - AI-powered note suggestions, summaries, or enhancements.
  - Generate smart content directly inside your notes.

- **Tech Stack**
  - **Backend:** Hono.js (lightweight Node.js framework)
  - **Database:**  PostgreSQL
  - **AI:** OpenAI API
  - **Authentication:** JWT / Session-based

---

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/SanjayMahato01/peacock-india-backend.git
cd peacock-india-notes-app

Install dependencies

npm install


Setup Environment Variables

Create a .env file:

DATABASE_URL="your_database_connection_string"
OPENAI_API_KEY="your_openai_api_key"
JWT_SECRET="your_jwt_secret"
PORT=5001


Prisma Setup

npx prisma generate        
npx prisma db push   



Run the application

npm run dev
