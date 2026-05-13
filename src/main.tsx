import "@/index.css";

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router";
import {
  ImageIcon,
  VideoIcon,
  UsersIcon,
  CarIcon,
  LogOutIcon,
} from "lucide-react";

import HomePage from "@/pages/HomePage";
import RealtimePage from "@/pages/RealtimePage";
import UsersPage from "@/pages/UsersPage";
import CarsPage from "@/pages/CarsPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="flex h-screen w-screen bg-amber-100">
        <aside className="flex flex-col gap-4 bg-amber-200 p-4">
          <nav>
            <ul className="flex flex-col gap-4">
              <li>
                <Link className="flex gap-1 rounded-md bg-amber-300 p-4" to="/">
                  <ImageIcon />
                </Link>
              </li>
              <li>
                <Link
                  className="flex gap-1 rounded-md bg-amber-300 p-4"
                  to="/realtime"
                >
                  <VideoIcon />
                </Link>
              </li>
              <li>
                <Link
                  className="flex gap-1 rounded-md bg-amber-300 p-4"
                  to="/users"
                >
                  <UsersIcon />
                </Link>
              </li>
              <li>
                <Link
                  className="flex gap-1 rounded-md bg-amber-300 p-4"
                  to="/cars"
                >
                  <CarIcon />
                </Link>
              </li>
            </ul>
          </nav>
          <div className="grow" />
          <Link className="flex gap-1 rounded-md bg-red-400 p-4" to="/login">
            <LogOutIcon />
          </Link>
        </aside>
        <main className="min-h-screen w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/realtime" element={<RealtimePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  </StrictMode>,
);
