import Footer from "@/components/footer";
import Hero from "@/components/hero";
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
} from "lucide-react";
import Image from "next/image";

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Comprehensive Accounting Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage your
              business finances efficiently and accurately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Calculator className="w-6 h-6" />,
                title: "Financial Dashboard",
                description: "Real-time overview of your business finances",
              },
              {
                icon: <Receipt className="w-6 h-6" />,
                title: "Invoice Management",
                description: "Create, send and track professional invoices",
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "Expense Tracking",
                description: "Categorize and monitor all business expenses",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Financial Reports",
                description: "Generate detailed reports with one click",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Tax Preparation",
                description: "Simplify tax season with organized records",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Multi-User Access",
                description: "Collaborate with your team and accountant",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Bank-Level Security",
                description: "Your financial data is always protected",
              },
              {
                icon: <PieChart className="w-6 h-6" />,
                title: "Budget Planning",
                description: "Set goals and track your financial progress",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                Powerful Financial Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Get a complete overview of your business finances at a glance.
                Our intuitive dashboard shows you what matters most:
              </p>
              <ul className="space-y-3">
                {[
                  "Cash flow monitoring with visual trends",
                  "Accounts receivable and payable tracking",
                  "Profit and loss snapshots",
                  "Recent transaction activity",
                  "Outstanding invoice alerts",
                  "Smart Budget",
                  "Target Focused",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="text-green-500 mt-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.3334 4L6.00008 11.3333L2.66675 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 mt-8 lg:mt-0">
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                  alt="Financial Dashboard Preview"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Free Access</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guaranteed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">∞</div>
              <div className="text-blue-100">Unlimited Features</div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Access Section */}
      <section className="py-20 bg-gray-50" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Free Access to All Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enjoy unlimited access to all FlowFin features at no cost during our launch period
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg">
              <div className="p-8 bg-blue-50">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">FlowFin Complete</h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-4xl font-bold text-blue-600">Free</span>
                    <span className="text-gray-500 ml-2">during launch</span>
                  </div>
                  <p className="text-gray-600">
                    Full access to all premium features while we perfect our platform
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <ul className="space-y-3">
                    {[
                      "Unlimited transactions",
                      "AI-powered insights",
                      "Smart budgeting",
                      "Receipt scanning",
                      "Financial reports",
                      "Multi-user access",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="text-green-500 mt-1">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.3334 4L6.00008 11.3333L2.66675 8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3">
                    {[
                      "Future forecasting",
                      "Custom categories",
                      "Goal tracking",
                      "Invoice management",
                      "Bank-level security",
                      "Priority support",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="text-green-500 mt-1">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.3334 4L6.00008 11.3333L2.66675 8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <a
                  href="/sign-up"
                  className="block text-center py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Using FlowFin Free
                </a>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                No credit card required • No hidden fees • Full feature access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Take Control of Your Finances?
          </h2>

          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their finances with FlowFin's
            comprehensive suite of tools - completely free during our launch period.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started Free
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

