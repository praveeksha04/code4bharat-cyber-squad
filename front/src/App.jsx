import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Pages/Navbar";
import Home from "./Pages/Home";
import UploadNotes from "./Pages/UploadNotes";
import LiveLecture from "./Pages/LiveLecture";
import PersonalizedLearning from "./Pages/PersonalizedLearning";
import Chat from "./Pages/Chat";

export default function App() {
  return (
    <Router>
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
      </div>
    </Router>
  );
}