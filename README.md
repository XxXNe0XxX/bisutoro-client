# 🍣 Bisutoro Client

> A responsive front-end web application for the **Bisutoro** restaurant, built with **React**, **Vite**, and **Tailwind CSS**.

This project serves as the **public client** for Bisutoro, focusing on presenting a beautiful, interactive, and responsive menu experience. It connects to a RESTful API (configured via environment variables) and is optimized for deployment on **Render**.

🔗 **Live Demo:** [bisutoro-client.onrender.com/menu](https://bisutoro-client.onrender.com/menu)

---

## 🖼️ Overview

Bisutoro Client provides users with a sleek and modern interface to explore menu items in an elegant, mobile-friendly layout. It uses **Tailwind CSS** for styling, **React Router** for navigation, and **Vite** for blazing-fast builds and hot module reloading during development.

This project was designed to:

- Demonstrate front-end best practices.
- Deliver a clean, responsive restaurant interface.
- Serve as a learning and showcase project for front-end development.

---

## 📁 Project Structure

bisutoro-client/
├── public/ # Static assets (favicon, HTML template)
├── src/
│ ├── assets/ # Images, icons, etc.
│ ├── components/ # Reusable React components
│ ├── pages/ # Main route-based views
│ ├── styles/ # Custom CSS or Tailwind extensions
│ ├── App.jsx # Root component
│ └── main.jsx # Entry point
├── .env.development.example # Sample environment config
├── .env.production.example # Sample production config
├── tailwind.config.js # Tailwind configuration
├── vite.config.js # Vite configuration
└── render.yaml # Render deployment configuration

---

## 🚀 Features

- ⚡ **Fast development** with Vite
- 🎨 **Modern UI** using Tailwind CSS
- 📱 **Responsive layout** across all devices
- 🌐 **API integration** via configurable base URL
- 🧩 **Reusable React components**
- 🧱 **Production-ready** setup for deployment on Render
- 🪵 **Environment-based logging system** for debugging

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org) (v16 or higher)
- npm (comes with Node)
- A running backend API (with CORS enabled)

---

### 2. Clone the Repository

```bash
git clone https://github.com/XxXNe0XxX/bisutoro-client.git
cd bisutoro-client
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy one of the example files and update it with your API base URL:

cp .env.development.example .env.development

Then edit .env.development:

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_LOG_LEVEL=debug
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
```

### 7. Preview the Production Build

```bash
npm run preview
```

☁️ Deployment (Render)

This project includes a render.yaml configuration file for easy deployment to Render
.

Render Setup:

Build Command:

```bash
npm ci --include=dev && npm run build
```

Publish Directory:

dist/

Environment Variables:

```bash
VITE_API_BASE_URL → Your backend API URL

VITE_LOG_LEVEL → info or error for production
```

Routing:
Client-side routes are automatically handled by rewriting all paths to index.html.

🧩 Logging & Debugging

A lightweight logger is included to show runtime information such as:

Environment (development / production)

API Base URL

Logging level

You can control the verbosity by setting:

VITE_LOG_LEVEL=debug | info | warn | error | silent

✅ Available Scripts
Command Description
```bash
npm run dev /* Start development server */
npm run build /* Build the app for production */
npm run preview /* Preview the production build locally */
```

🧱 Tech Stack

Tool Purpose

React UI library for building components

Vite Fast development and build tool

Tailwind CSS Utility-first styling framework

Render Hosting and deployment platform

JavaScript (ES6+) Core programming language

🔮 Future Improvements

🧠 State management using Redux or Context API

🧪 Unit and integration tests

♿ Improved accessibility (ARIA support, keyboard navigation)

---

👨‍💻 Author

Jose

Front-End Developer passionate about clean UI, smooth UX, and modern web technologies.

🔗 Live Project [https://bisutoro-client.onrender.com/menu]

📂 GitHub Repository [https://github.com/XxXNe0XxX/bisutoro-client]

📜 License

This project is open-source. You may use and modify it freely for educational or non-commercial purposes.
