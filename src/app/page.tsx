import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
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
import { createClient } from "../../supabase/server";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
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
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Businesses Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2B+</div>
              <div className="text-blue-100">Transactions Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guaranteed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Trusted by Businesses Like Yours
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "This accounting platform has transformed how we manage our finances. The real-time dashboard and automated invoicing save us hours every week.",
                author: "Sarah Johnson",
                position: "CFO, Bright Solutions Inc.",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
              },
              {
                quote:
                  "As a small business owner, I needed something powerful yet easy to use. This platform delivers exactly that, plus the reporting features make tax time so much easier.",
                author: "Michael Chen",
                position: "Owner, Chen Consulting",
                avatar:
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
              },
              {
                quote:
                  "The ability to give my accountant secure access to our books has streamlined our monthly closing process. I can't imagine going back to our old system.",
                author: "Jessica Rivera",
                position: "Operations Director, Rivertech",
                avatar:
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl border border-gray-100"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4 flex-grow">
                    <p className="italic text-gray-600">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">
                        {testimonial.position}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$19",
                period: "/month",
                description: "Perfect for freelancers and solo entrepreneurs",
                features: [
                  "Financial dashboard",
                  "Up to 50 invoices per month",
                  "Expense tracking",
                  "Basic financial reports",
                  "Email support",
                ],
                cta: "Get Started",
                highlighted: false,
              },
              {
                name: "Business",
                price: "$49",
                period: "/month",
                description: "Ideal for growing small businesses",
                features: [
                  "Everything in Starter",
                  "Unlimited invoices",
                  "Multi-user access (up to 3)",
                  "Advanced reporting",
                  "Bank reconciliation",
                  "Priority support",
                ],
                cta: "Get Started",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "$99",
                period: "/month",
                description: "For established businesses with complex needs",
                features: [
                  "Everything in Business",
                  "Unlimited users",
                  "Custom financial reports",
                  "API access",
                  "Dedicated account manager",
                  "24/7 phone & email support",
                ],
                cta: "Contact Sales",
                highlighted: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden ${plan.highlighted ? "border-2 border-blue-500 shadow-lg" : "border border-gray-200 shadow-sm"}`}
              >
                <div
                  className={`p-6 ${plan.highlighted ? "bg-blue-50" : "bg-white"}`}
                >
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
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
                  <a
                    href="/sign-up"
                    className={`block text-center py-3 px-4 rounded-lg font-medium ${plan.highlighted ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"} transition-colors`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
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
            Join thousands of businesses that trust our platform for their
            accounting needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Your Free Trial
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
