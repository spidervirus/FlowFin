"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Clock, Bell, Star } from "lucide-react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Coming Soon Section */}
      <section className="pt-32 pb-20 flex items-center justify-center min-h-[80vh]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Clock className="w-12 h-12 text-white" />
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Coming Soon
            </h1>

            {/* Subheading */}
            <h2 className="text-3xl font-semibold mb-6 text-gray-800">
              Pricing Plans
            </h2>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              We're working hard to bring you flexible and affordable pricing options. 
              Our team is crafting the perfect plans to suit businesses of all sizes.
            </p>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
                <p className="text-gray-600 text-sm">Perfect for getting started</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Professional</h3>
                <p className="text-gray-600 text-sm">For growing businesses</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
                <p className="text-gray-600 text-sm">Custom solutions</p>
              </div>
            </div>

            {/* Notification Signup */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Get Notified</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Be the first to know when our pricing plans are available. We'll send you an email as soon as they're ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Notify Me
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                Expected launch: <span className="font-medium text-gray-700">Soon</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}