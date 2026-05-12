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

import Home from "@/pages/Home";
import Login from "@/pages/Login.tsx";
import NotFound from "@/pages/NotFound";
import RealtimeCheck from "@/pages/RealtimeCheck";

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
            <Route path="/" element={<Home />} />
            <Route path="/realtime" element={<RealtimeCheck />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  </StrictMode>,
);
