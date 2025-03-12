import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  BarChart3,
  Receipt,
  CreditCard,
} from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                Modern
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 block">
                  Accounting Software
                </span>
                for Growing Businesses
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Simplify your financial management with our intuitive accounting
                platform. Track expenses, create invoices, and generate reports
                with ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium w-full sm:w-auto justify-center"
                >
                  Start Free Trial
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>

                <Link
                  href="#pricing"
                  className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium w-full sm:w-auto justify-center"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>30-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 mt-12 lg:mt-0 relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                  alt="Financial Dashboard"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>

              {/* Floating feature icons */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-full shadow-lg border border-gray-100">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="absolute top-1/2 -right-6 bg-white p-4 rounded-full shadow-lg border border-gray-100">
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
              <div className="absolute -bottom-6 left-1/4 bg-white p-4 rounded-full shadow-lg border border-gray-100">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
