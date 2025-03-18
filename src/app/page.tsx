import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import CountdownTimer from "@/components/countdown-timer";
import WaitlistForm from "@/components/waitlist-form";
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
      <Navbar />
      
      {/* Coming Soon Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium shadow-lg">
              Launching Soon
            </span>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            The Future of Financial Management
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            We're building a powerful platform that will revolutionize how you manage your business finances. Join our waitlist to be the first to know when we launch.
          </p>
          
          {/* Countdown Timer */}
          <div className="mb-12">
            <CountdownTimer />
          </div>
          
          {/* Waitlist Form */}
          <WaitlistForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Comprehensive Accounting Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform will provide all the tools you need to manage your
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

      <Footer />
    </div>
  );
}
