import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import WorkoutList from "./pages/WorkoutList";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import Exercises from "./pages/Exercises";
import DoWorkout from "./pages/DoWorkout";
import SessionDetail from "./pages/SessionDetail";
import Profile from "./pages/Profile";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<WorkoutList />} />
            <Route path="/builder" element={<WorkoutBuilder />} />
            <Route path="/builder/:id" element={<WorkoutBuilder />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/do/:id" element={<DoWorkout />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
