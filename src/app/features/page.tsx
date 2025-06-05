import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  ArrowUpRight,
  BarChart3,
  Calculator,
  CreditCard,
  FileText,
  PieChart,
  Receipt,
  Shield,
  Users,
  Zap,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Smartphone,
  Cloud,
  Lock,
  Bell,
  Download,
  Upload,
} from "lucide-react";
import Image from "next/image";

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Powerful Features for Modern Businesses
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover how FlowFin's comprehensive suite of financial tools can transform 
              your business operations and drive growth with intelligent automation.
            </p>
          </div>

          {/* Feature Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { number: "50+", label: "Features Available" },
              { number: "99.9%", label: "Uptime Guarantee" },
              { number: "24/7", label: "Support Available" },
              { number: "∞", label: "Transactions" },
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Financial Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Everything you need to manage your business finances efficiently and accurately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calculator className="w-8 h-8" />,
                title: "Financial Dashboard",
                description: "Real-time overview of your business finances with interactive charts and key metrics.",
                features: ["Live cash flow tracking", "Visual trend analysis", "Custom KPI widgets"],
                gradient: "from-blue-500 to-blue-700",
              },
              {
                icon: <Receipt className="w-8 h-8" />,
                title: "Invoice Management",
                description: "Create, send, and track professional invoices with automated follow-ups.",
                features: ["Custom templates", "Automated reminders", "Payment tracking"],
                gradient: "from-green-500 to-green-700",
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Expense Tracking",
                description: "Categorize and monitor all business expenses with smart automation.",
                features: ["Receipt scanning", "Auto-categorization", "Expense reports"],
                gradient: "from-purple-500 to-purple-700",
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Financial Reports",
                description: "Generate detailed reports with one click for better decision making.",
                features: ["P&L statements", "Balance sheets", "Cash flow reports"],
                gradient: "from-orange-500 to-orange-700",
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: "Tax Preparation",
                description: "Simplify tax season with organized records and automated calculations.",
                features: ["Tax-ready reports", "Deduction tracking", "Compliance alerts"],
                gradient: "from-red-500 to-red-700",
                comingSoon: true,
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Multi-User Access",
                description: "Collaborate with your team and accountant with role-based permissions.",
                features: ["Role management", "Activity logs", "Secure sharing"],
                gradient: "from-indigo-500 to-indigo-700",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative"
              >
                {feature.comingSoon && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">AI-Powered Intelligence</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Leverage artificial intelligence to automate tasks and gain deeper insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                {[
                  {
                    icon: <Zap className="w-6 h-6" />,
                    title: "Smart Categorization",
                    description: "AI automatically categorizes transactions based on patterns and merchant data.",
                  },
                  {
                    icon: <Target className="w-6 h-6" />,
                    title: "Predictive Analytics",
                    description: "Forecast cash flow and identify potential financial opportunities or risks.",
                  },
                  {
                    icon: <TrendingUp className="w-6 h-6" />,
                    title: "Intelligent Insights",
                    description: "Get personalized recommendations to optimize your financial performance.",
                  },
                  {
                    icon: <Clock className="w-6 h-6" />,
                    title: "Automated Workflows",
                    description: "Set up smart rules to automate repetitive financial tasks and processes.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-4">AI Dashboard</span>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
                  alt="AI Dashboard Preview"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Your financial data is protected with bank-level security and compliance standards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Bank-Level Encryption",
                description: "256-bit SSL encryption protects all data in transit and at rest.",
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: "Two-Factor Authentication",
                description: "Add an extra layer of security with 2FA and biometric login options.",
              },
              {
                icon: <Cloud className="w-8 h-8" />,
                title: "Secure Cloud Storage",
                description: "Data backed up across multiple secure data centers with 99.9% uptime.",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-8 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile & Integration */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-4xl font-bold">Mobile-First Design</h2>
                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
              <p className="text-gray-600 mb-8 text-lg">
                Access your financial data anywhere, anytime with our responsive mobile app 
                and seamless integrations.
              </p>
              <div className="space-y-6">
                {[
                  {
                    icon: <Smartphone className="w-6 h-6" />,
                    title: "Native Mobile Apps",
                    description: "iOS and Android apps with full feature parity.",
                  },
                  {
                    icon: <Bell className="w-6 h-6" />,
                    title: "Real-time Notifications",
                    description: "Stay updated with instant alerts and reminders.",
                  },
                  {
                    icon: <Download className="w-6 h-6" />,
                    title: "Offline Access",
                    description: "View and edit data even without internet connection.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
                <div className="text-center mb-8">
                  <Smartphone className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">FlowFin Mobile</h3>
                  <p className="text-blue-100">Full-featured mobile experience</p>
                </div>
                <div className="space-y-4">
                  {[
                    "Scan receipts with camera",
                    "Voice-to-text transaction entry",
                    "Biometric authentication",
                    "Offline data synchronization",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Experience These Features?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of businesses already using FlowFin to streamline their 
            financial operations and drive growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Start Free Trial
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </a>
            <a
              href="/about"
              className="inline-flex items-center justify-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg"
            >
              Learn More
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Full feature access • Cancel anytime
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}