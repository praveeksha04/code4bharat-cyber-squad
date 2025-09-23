import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Chat = () => {
  const { id } = useParams(); // Task ID from route
  const suggestions = [
    {
      id: 1,
      title: "Review Data Structures & Algorithms",
      description: "Complete yesterday's practice problems on arrays and linked lists",
      priority: "high",
      category: "Programming",
      estimatedTime: "45 min",
      icon: "💻",
    },
    {
      id: 2,
      title: "LeetCode Practice Session",
      description: "Solve 2 new problems focusing on dynamic programming",
      priority: "medium",
      category: "Problem Solving",
      estimatedTime: "60 min",
      icon: "🧩",
    },
    {
      id: 3,
      title: "AI Fundamentals Video",
      description: "Watch lecture on neural network architectures and applications",
      priority: "low",
      category: "Learning",
      estimatedTime: "30 min",
      icon: "🎥",
    },
    {
      id: 4,
      title: "Project Documentation",
      description: "Update README and add code comments to current project",
      priority: "medium",
      category: "Development",
      estimatedTime: "25 min",
      icon: "📝",
    },
  ];

  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I am your AI learning assistant 🤖" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTaskById = (taskId) => suggestions.find((s) => s.id === taskId);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: input }]);
    const userMessage = input;
    setInput("");

    const taskId = parseInt(id, 10);
    const task = getTaskById(taskId);

    if (!task) {
      setMessages((prev) => [...prev, { from: "bot", text: "Task not found." }]);
      return;
    }

    try {
      const prompt = `
You are an AI assistant. Here is the current task:
Title: ${task.title}
Description: ${task.description}
Category: ${task.category}
Priority: ${task.priority}
Estimated Time: ${task.estimatedTime}

Answer the following user question: ${userMessage}
`;

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCQ1WJkwCn28DvDnVwgIX9ztEcumVk8Euw", // ⚠️ Replace with your Gemini API Key
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const answer = response.data.candidates[0].content.parts[0].text;
      setMessages((prev) => [...prev, { from: "bot", text: answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Error fetching AI response." },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-lg flex flex-col h-[500px]">
      <h2 className="text-xl font-bold mb-4">AI Learning Chatbot 🤖</h2>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg whitespace-pre-wrap ${
              msg.from === "bot"
                ? "bg-gray-200 self-start"
                : "bg-blue-500 text-white self-end"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 border rounded-l-lg p-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;