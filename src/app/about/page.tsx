import { Heart, Target, Users, Sparkles } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      title: "Our Mission",
      description: "To empower individuals and businesses with intelligent financial management tools that make money management simple, efficient, and enjoyable.",
      icon: Target,
    },
    {
      title: "Our Vision",
      description: "To revolutionize personal finance management by combining cutting-edge AI technology with intuitive design, making financial success accessible to everyone.",
      icon: Sparkles,
    },
    {
      title: "Our Values",
      description: "We believe in transparency, innovation, and putting our users first. Every feature we build is designed with your financial success in mind.",
      icon: Heart,
    },
    {
      title: "Our Community",
      description: "Join a growing community of users who are taking control of their financial future with FlowFin.",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About FlowFin
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're on a mission to transform the way people manage their finances through innovative technology and user-friendly design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <value.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {value.title}
              </h3>
              <p className="text-gray-600">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Our Story
          </h2>
          <p className="text-gray-600 mb-4">
            FlowFin was born from a simple observation: managing personal finances should be easier, more intuitive, and more powerful. We combined our expertise in financial technology with cutting-edge AI to create a platform that not only tracks your money but helps you make smarter financial decisions.
          </p>
          <p className="text-gray-600">
            Today, we're proud to be building the future of personal finance management, one feature at a time. Our commitment to innovation and user experience drives everything we do, from the design of our interface to the development of our AI-powered features.
          </p>
        </div>

        <div className="text-center mt-16">
          <a
            href="#waitlist"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium"
          >
            Join the Waitlist
          </a>
        </div>
      </div>
    </div>
  );
} 