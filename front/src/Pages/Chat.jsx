import React, { useState, useEffect, useRef } from "react";

const Chat = () => {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I am your AI learning assistant 🤖" },
    { from: "bot", text: "Let's begin! What LeetCode array problems would you like to try?" },
  ]);

  const [input, setInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0); // track which array problem is next
  const messagesEndRef = useRef(null);

  const arrayProblems = [
    { name: "Two Sum", link: "https://leetcode.com/problems/two-sum/" },
    { name: "Maximum Subarray", link: "https://leetcode.com/problems/maximum-subarray/" },
    { name: "Rotate Array", link: "https://leetcode.com/problems/rotate-array/" },
    { name: "Best Time to Buy and Sell Stock", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
    { name: "Contains Duplicate", link: "https://leetcode.com/problems/contains-duplicate/" },
    { name: "Move Zeroes", link: "https://leetcode.com/problems/move-zeroes/" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInput("");

    if (
      userMessage.toLowerCase().includes("suggest array problems") ||
      userMessage.toLowerCase().includes("arrays") ||
      userMessage.toLowerCase().includes("next") ||
      userMessage.toLowerCase().includes("done")
    ) {
      if (currentIndex >= arrayProblems.length) {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "🎉 You have completed all the beginner array problems!" },
        ]);
        return;
      }

      const problem = arrayProblems[currentIndex];
      const botReply = {
        from: "bot",
        text: (
          <div>
            Next array problem:
            <br />
            👉{" "}
            <a href={problem.link} target="_blank" rel="noopener noreferrer" style={{ color: "blue" }}>
              {problem.name}
            </a>
          </div>
        ),
      };
      setMessages((prev) => [...prev, botReply]);
      setCurrentIndex(currentIndex + 1); // move to next problem
      return;
    }

    // ---------------------------
    // AI fallback for other questions
    // ---------------------------
    const botReply = {
      from: "bot",
      text: "I can help you with arrays. Type 'done' or 'next' to get the next problem 🚀",
    };
    setMessages((prev) => [...prev, botReply]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-lg flex flex-col h-[700px]">
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
