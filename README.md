🚀 Collabri-X

A Full-Stack Real-Time Collaborative Whiteboarding Platform with AI & Video Integration

🌐 Overview

Collabri-X is a production-ready real-time collaboration platform built using the MERN stack.
It enables teams to brainstorm, draw, communicate, and persist ideas in a shared interactive workspace.

Designed for startups, EdTech platforms, remote teams, and product companies.

✨ Key Features

🖊 Real-Time Whiteboard
	•	Infinite canvas drawing
	•	Shapes, text, pencil tools
	•	Multi-user live collaboration
	•	Live cursors with user names

🔐 Authentication System
	•	Email & Password login
	•	Google OAuth integration
	•	JWT-based secure authentication
	•	Protected routes & middleware

🤖 AI Integration
	•	Smart diagram generation
	•	UX critique simulation
	•	Sticky notes summarization
	•	AI flowchart mock demo

🎥 Collaboration Tools
	•	WebRTC screen sharing (PiP style)
	•	Presenter mode
	•	Live participant indicators

📂 Version History
	•	Snapshot preview
	•	Timeline scrubbing
	•	Export-ready structure

📦 Templates System
	•	Kanban board
	•	User journey mapping
	•	Wireframing layouts
	•	Interactive sandbox mode

⸻

🛠 Tech Stack

Frontend
	•	React (Vite)
	•	Tailwind CSS
	•	Framer Motion
	•	React Konva
	•	React Router
	•	Google OAuth (@react-oauth/google)

Backend
	•	Node.js
	•	Express.js
	•	MongoDB (Atlas)
	•	JWT Authentication
	•	Google Token Verification (google-auth-library)
	•	Bcrypt Password Hashing



⚙️ Installation (Local Setup)
1️⃣ Clone Repository:-
git clone https://github.com/your-username/Collabri-X.git
cd Collabri-X


2️⃣ Backend Setup
cd server
npm install

Create .env file:

PORT=5001
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id

Run:
npm run dev


3️⃣ Frontend Setup
cd client
npm install

Create .env:

VITE_GOOGLE_CLIENT_ID=your_google_client_id

Run:
npm run dev

🔐 Security Features
	•	JWT-based authentication
	•	Password hashing with bcrypt
	•	OAuth token verification
	•	Environment variable protection
	•	CORS configuration
	•	Secure production-ready structure


  📈 Potential Use Cases
	•	Remote team collaboration
	•	Online education whiteboard
	•	Startup brainstorming platform
	•	UX research sessions
	•	Interview coding whiteboard
	•	Internal product planning tool

⸻

👨‍💻 Author

Developed by Ritik Kumar
Full-Stack MERN Developer
Specialized in Real-Time Collaboration Systems

