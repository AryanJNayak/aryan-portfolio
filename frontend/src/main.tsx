/**
 * React entry point.
 *
 * Purpose: Mount the app with client-side routing (public site + project detail
 *          pages + admin panel). Also applies the persisted theme class up-front
 *          so every route (not just "/") renders in the correct theme.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "@/App";
import AdminPage from "@/admin/AdminPage";
import ProjectDetail from "@/pages/ProjectDetail";
import "@/index.css";

// Apply the saved theme (default dark) before first paint so themed routes are
// correct regardless of which page loads first.
const savedTheme = localStorage.getItem("portfolio_theme");
document.documentElement.classList.toggle("dark", savedTheme ? savedTheme === "dark" : true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
