import { Link } from "react-router-dom";

export default function Home() {
  const features = [
    {
      title: "Upload Notes",
      description: "Convert documents to audio with OCR and text-to-speech",
      icon: "📄",
      link: "/upload",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Live Lecture",
      description: "Real-time speech-to-text transcription for live events",
      icon: "🎤",
      link: "/lecture", 
      color: "from-green-500 to-green-600"
    },
    {
      title: "Personalized Learning",
      description: "AI-powered learning recommendations and progress tracking",
      icon: "🧠",
      link: "/learning",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            AI-Powered Accessibility Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Empowering inclusive learning through advanced AI technologies. 
            Transform documents, transcribe speech, and personalize your educational journey.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/upload" 
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 border border-blue-600"
          >
            Get Started
          </Link>
          <Link 
            to="/lecture" 
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200"
          >
            Try Live Demo
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Link 
            key={index}
            to={feature.link}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100"
          >
            <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
              Explore <span className="ml-2">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">100%</div>
            <div className="text-gray-600">Accessible</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">Real-time</div>
            <div className="text-gray-600">Processing</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">AI-Powered</div>
            <div className="text-gray-600">Learning</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600">Multi-format</div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}