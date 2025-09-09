// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import App from "./App";
import LoginPage from "./LoginPage";
import "./index.css"; // ← CRITICAL: Tailwind + your custom classes


createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
