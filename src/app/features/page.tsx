import { BarChart3, PiggyBank, Receipt, Brain, LineChart, Target, Shield, Zap } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "Smart Dashboard",
      description: "Get a comprehensive overview of your financial health with intuitive charts and summaries.",
      icon: BarChart3,
    },
    {
      title: "AI-Powered Insights",
      description: "Leverage artificial intelligence to get personalized financial recommendations and insights.",
      icon: Brain,
    },
    {
      title: "Smart Budgeting",
      description: "Create and manage budgets with AI-powered suggestions based on your spending patterns.",
      icon: PiggyBank,
    },
    {
      title: "Receipt Scanner",
      description: "Automatically extract data from receipt images and PDFs to create transactions.",
      icon: Receipt,
    },
    {
      title: "Future Forecasting",
      description: "Predict future expenses and income based on historical data and trends.",
      icon: LineChart,
    },
    {
      title: "Financial Goals",
      description: "Set and track your financial goals with smart progress monitoring.",
      icon: Target,
    },
    {
      title: "Bank-Level Security",
      description: "Your data is protected with enterprise-grade security and encryption.",
      icon: Shield,
    },
    {
      title: "Real-Time Updates",
      description: "Get instant notifications and updates about your financial status.",
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Your Financial Success
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            FlowFin combines cutting-edge technology with intuitive design to help you manage your finances effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
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