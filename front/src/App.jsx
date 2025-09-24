import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Navbar from "./Pages/Navbar";
import Home from "./Pages/Home";
import UploadNotes from "./Pages/UploadNotes";
import LiveLecture from "./Pages/LiveLecture";
import PersonalizedLearning from "./Pages/PersonalizedLearning";
import Chat from "./Pages/Chat";
import VoiceAssistant from "./Pages/VoiceAssistant";
import React from "react";

function AppWrapper() {
  const navigate = useNavigate();

  const handleCommand = (command) => {
    if (!command || typeof command !== "string") {
      console.warn("Handele command cannot call", command);
      return;
    }
    const cmd = command.trim().toLowerCase();
    if (cmd.includes("live lecture")) {
      navigate("/lecture");
    } else if (cmd.includes("upload")) {
      navigate("/upload");
    } else if (cmd.includes("learning")) {
      navigate("/learning");
    } else if (cmd.includes("chat")) {
      navigate("/learning/1");
    } else if (cmd.includes("home")) {
      navigate("/");
    } else {
      console.log("❓ Unrecognized command:", command);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadNotes />} />
          <Route path="/lecture" element={<LiveLecture />} />
          <Route path="/learning" element={<PersonalizedLearning />} />
          <Route path="/learning/:id" element={<Chat />} />
        </Routes>
      </main>
      {/* Voice Assistant runs in background */}
      <VoiceAssistant onCommand={handleCommand} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
