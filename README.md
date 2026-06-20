<div align="center">
  <img src="https://img.shields.io/badge/Version-2.0-red.svg" alt="Version 2.0" />
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" alt="Node.js" />
</div>

<br />

# 🛡️ CyberKavach 2.0

**CyberKavach 2.0** is an advanced, high-performance web platform designed to manage the operations, events, and members of the Cyber Security Club. Featuring a sleek, futuristic UI and a highly optimized backend, it acts as the central intelligence hub for all club activities.

---

## ✨ Features

- **Role-Based Access Control (RBAC):** Hierarchical clearance levels including Faculty, Student Coordinators, Tech Team, and Social Media.
- **Advanced Event Management:** End-to-end event lifecycles. Create events, request faculty approvals, track registrations, and manage team sizes.
- **Dynamic Certificate Generation:** An interactive Canvas-based editor to design certificates. Supports bulk CSV imports, auto-generation, Cloudinary storage, and automated email delivery.
- **AI-Powered Chatbot:** Integrated with Google Gemini AI to assist users with operational intelligence and club-related queries.
- **Progressive Web App (PWA):** Installable on mobile and desktop with offline support for rapid check-ins and dashboard access.
- **Live Analytics Dashboard:** Track attendance, user engagement, and event statistics with interactive, visually stunning graphs.
- **Optimized Performance:** Multi-tiered architecture utilizing Redis caching to eliminate N+1 query bottlenecks and ensure sub-second response times.

---

## 🚀 Tech Stack

### **Frontend (Client)**
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Custom CSS Variables
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Language:** TypeScript

### **Backend (Server)**
- **Runtime:** Node.js + Express.js
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Caching:** Redis
- **Language:** TypeScript

### **Integrations & Services**
- **Cloud Storage:** Cloudinary (Avatars, Event Posters, Certificate PDFs)
- **Email Service:** Resend API
- **AI:** Google Gemini API

---

## 📂 Project Structure

```text
cyberkavach2.0/
├── client/                 # Next.js Frontend Application
│   ├── public/             # Static assets, Service Worker (PWA)
│   ├── src/
│   │   ├── app/            # App Router pages & API routes
│   │   ├── components/     # Reusable UI components & animations
│   │   └── lib/            # Utilities, context providers, API wrappers
│   └── package.json
├── server/                 # Node.js/Express Backend Application
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── lib/            # External services (Redis, Email, Prisma)
│   │   ├── middlewares/    # Auth, Validation, Upload handlers
│   │   └── routes/         # Express API endpoints
│   └── package.json
└── README.md
```

---

## ⚙️ Environment Variables

To run the project locally, create a `.env` file in both the `client` and `server` directories based on the `.env.example` templates.

### `server/.env`
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cyberkavach"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-secure-jwt-secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000

# Cloudinary
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"

# AI Integration
GEMINI_API_KEY="your-google-gemini-key"

# Email
RESEND_API_KEY="your-resend-api-key"
```

### `client/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

---

## 🛠️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/IshanShastri30126/Cyberkavach2.0.git
cd Cyberkavach2.0
```

### 2. Install Dependencies
Open two terminal windows.
**Terminal 1 (Backend):**
```bash
cd server
npm install
```
**Terminal 2 (Frontend):**
```bash
cd client
npm install
```

### 3. Setup the Database (Backend)
Ensure your PostgreSQL server is running and configured in `server/.env`.
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the Development Servers
**Terminal 1 (Backend):**
```bash
npm run dev
```
**Terminal 2 (Frontend):**
```bash
npm run dev
```

The application should now be running at `http://localhost:3000`.

---

## 📜 Available Scripts

### Client
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint checks.

### Server
- `npm run dev`: Starts the Express server with Nodemon (auto-reload).
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled JavaScript application.

---

<div align="center">
  <i>Developed with ❤️ for CyberKavach.</i>
</div>
