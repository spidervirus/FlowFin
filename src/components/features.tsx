import {
  BarChart3,
  Receipt,
  CreditCard,
  PieChart,
  Users,
  FileText,
  Wallet,
  BrainCircuit,
  Clock,
} from "lucide-react";

const features = [
  {
    name: "Financial Analytics",
    description:
      "Get real-time insights into your business performance with interactive charts and customizable reports.",
    icon: BarChart3,
  },
  {
    name: "Smart Invoicing",
    description:
      "Create and send professional invoices in seconds. Track payments and automate reminders.",
    icon: Receipt,
  },
  {
    name: "Expense Management",
    description:
      "Easily track and categorize expenses. Capture receipts with our mobile app.",
    icon: CreditCard,
  },
  {
    name: "Budget Planning",
    description:
      "Set and monitor budgets for different departments. Get alerts when approaching limits.",
    icon: PieChart,
  },
  {
    name: "Multi-User Access",
    description:
      "Collaborate with your team. Set custom permissions and roles for different users.",
    icon: Users,
  },
  {
    name: "Financial Reports",
    description:
      "Generate detailed financial reports including P&L, balance sheets, and cash flow statements.",
    icon: FileText,
  },
  {
    name: "Bank Integration",
    description:
      "Connect your bank accounts for automatic transaction imports and reconciliation.",
    icon: Wallet,
  },
  {
    name: "AI-Powered Insights",
    description:
      "Get intelligent suggestions for cost savings and revenue optimization.",
    icon: BrainCircuit,
  },
  {
    name: "Real-Time Updates",
    description:
      "Stay up-to-date with real-time financial data and automated daily backups.",
    icon: Clock,
  },
];

export default function Features() {
  return (
    <div className="bg-white py-24" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Your Business
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your business finances efficiently and make informed decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition-colors duration-300 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.name}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 