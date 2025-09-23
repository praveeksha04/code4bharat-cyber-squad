import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PersonalizedLearning() {
  const [completedItems, setCompletedItems] = useState(new Set());
   const navigate = useNavigate();

  const suggestions = [
    {
      id: 1,
      title: "Review Data Structures & Algorithms",
      description: "Complete yesterday's practice problems on arrays and linked lists",
      priority: "high",
      category: "Programming",
      estimatedTime: "45 min",
      icon: "💻"
    },
    {
      id: 2,
      title: "LeetCode Practice Session",
      description: "Solve 2 new problems focusing on dynamic programming",
      priority: "medium",
      category: "Problem Solving",
      estimatedTime: "60 min",
      icon: "🧩"
    },
    {
      id: 3,
      title: "AI Fundamentals Video",
      description: "Watch lecture on neural network architectures and applications",
      priority: "low",
      category: "Learning",
      estimatedTime: "30 min",
      icon: "🎥"
    },
    {
      id: 4,
      title: "Project Documentation",
      description: "Update README and add code comments to current project",
      priority: "medium",
      category: "Development",
      estimatedTime: "25 min",
      icon: "📝"
    }
  ];

  const toggleComplete = (id) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedItems(newCompleted);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Programming': return 'bg-blue-100 text-blue-800';
      case 'Problem Solving': return 'bg-purple-100 text-purple-800';
      case 'Learning': return 'bg-green-100 text-green-800';
      case 'Development': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Personalized Learning
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered recommendations tailored to your learning goals and progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{suggestions.length}</div>
          <div className="text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl font-bold text-green-600">{completedItems.size}</div>
          <div className="text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl font-bold text-purple-600">
            {Math.round((completedItems.size / suggestions.length) * 100)}%
          </div>
          <div className="text-gray-600">Progress</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl font-bold text-orange-600">2.5h</div>
          <div className="text-gray-600">Est. Time</div>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Today's Recommendations</h2>
        
        <div className="grid gap-6">
          {suggestions.map((item) => (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl border-l-4 ${
                completedItems.has(item.id) 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleComplete(item.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        completedItems.has(item.id)
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {completedItems.has(item.id) && '✓'}
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <h3 className={`text-xl font-bold ${
                        completedItems.has(item.id) ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </h3>
                    </div>
                    
                    <p className={`text-gray-600 mb-4 ${
                      completedItems.has(item.id) ? 'line-through' : ''
                    }`}>
                      {item.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                        {item.priority} priority
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={() => navigate(`/learning/${item.id}`)}
                    className="px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span>▶️</span>
                      <span>Start</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Progress</h2>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{completedItems.size} of {suggestions.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedItems.size / suggestions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Add Custom Task</h3>
          <p className="text-blue-100 mb-4">Create your own learning goals and track progress</p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-600">
            <div className="flex items-center space-x-2">
              <span>➕</span>
              <span>Create Task</span>
            </div>
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">View Analytics</h3>
          <p className="text-purple-100 mb-4">Track your learning patterns and achievements</p>
          <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-purple-600">
            <div className="flex items-center space-x-2">
              <span>📊</span>
              <span>View Stats</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}