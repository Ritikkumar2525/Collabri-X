<div align="center">
  <br />
  <img src="client/public/favicon.svg" alt="Collabrix Logo" width="80" />
  <h1>Collabrix</h1>
  <p><strong>A Luxury Real-Time Collaborative Workspace & Whiteboarding Platform</strong></p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  </p>
</div>

<br />

## 📖 About Collabrix

**Collabrix** is a production-ready, high-performance collaborative platform designed for modern teams. Built on the MERN stack with a sleek, luxury dark theme, it empowers teams to brainstorm, design, and execute ideas in a shared, real-time digital workspace. 

Whether you're mapping out user journeys, wireframing a new product, or hosting a live design critique with integrated AI assistance and WebRTC video sharing, Collabrix provides a seamless, distraction-free environment.

---

## ✨ Key Features

- **🖊️ Real-Time Multiplayer Whiteboard:** Infinite canvas with drawing tools, live cursors, and real-time presence indicators.
- **🤖 Integrated AI Assistant:** Smart diagram generation, sticky note summarization, and UX critique simulation right in your workspace.
- **🎥 Live Collaboration:** WebRTC screen sharing, presenter modes, and integrated audio/video tools.
- **📦 Smart Templates:** Instantly generate Kanban boards, User Journey maps, and SWOT analyses.
- **🔐 Secure Authentication:** JWT-based auth with Google OAuth integration and protected routing.
- **🎨 Luxury UI/UX:** A bespoke dark-mode aesthetic featuring deep obsidian backgrounds, vibrant red accents, and smooth Framer Motion animations.

---

## 🛠 Tech Stack

**Frontend Architecture:**
* React (Vite) for blazing-fast rendering
* Tailwind CSS for modern utility-first styling
* Framer Motion for fluid, physics-based animations
* React Konva for high-performance HTML5 canvas manipulation
* React Router DOM for SPA routing

**Backend & Infrastructure:**
* Node.js & Express.js server
* MongoDB (Atlas) for secure data persistence
* Socket.io & Yjs for real-time state synchronization
* JWT & Google Auth Library for secure access
* Vercel-ready configuration for seamless frontend deployment

---

## 🚀 Getting Started (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/Ritikkumar2525/Collabri-X.git
cd Collabri-X
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5001
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
Start the Vite development server:
```bash
npm run dev
```

---

## 🌐 Deployment

This project is optimized for deployment on Vercel. 
The client folder includes a `vercel.json` file configured to rewrite all routes to `index.html` for perfect React Router SPA compatibility.

To deploy, simply connect your GitHub repository to Vercel and set the Root Directory to `client/`.

---

<div align="center">
  <i>Developed by <b>Ritik Kumar</b> — Full-Stack MERN Developer specialized in Real-Time Systems.</i>
</div>
