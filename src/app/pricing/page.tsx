import React from "react";
import { Check, Star, Zap, Shield, Users, TrendingUp } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "Forever",
      description: "Perfect for individuals and small businesses getting started",
      features: [
        "Up to 100 transactions per month",
        "Basic expense tracking",
        "Simple reporting",
        "Mobile app access",
        "Email support",
        "Bank account connection (1 account)"
      ],
      popular: false,
      buttonText: "Get Started Free",
      buttonVariant: "outline"
    },
    {
      name: "Professional",
      price: "$19",
      period: "per month",
      description: "Ideal for growing businesses with advanced needs",
      features: [
        "Unlimited transactions",
        "Advanced expense categorization",
        "Custom reporting & analytics",
        "Multi-currency support",
        "Priority support",
        "Multiple bank accounts",
        "Invoice generation",
        "Tax preparation tools",
        "Team collaboration (up to 5 users)"
      ],
      popular: true,
      buttonText: "Start Free Trial",
      buttonVariant: "default"
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "per month",
      description: "Comprehensive solution for large organizations",
      features: [
        "Everything in Professional",
        "Unlimited team members",
        "Advanced integrations",
        "Custom workflows",
        "Dedicated account manager",
        "24/7 phone support",
        "Advanced security features",
        "Custom reporting",
        "API access",
        "White-label options"
      ],
      popular: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline"
    }
  ];

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Process transactions and generate reports in seconds"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Bank-Level Security",
      description: "Your financial data is protected with enterprise-grade encryption"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Work together with your team and accountant seamlessly"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Smart Analytics",
      description: "Get insights that help you make better financial decisions"
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your business. Start free and upgrade as you grow.
            No hidden fees, no surprises.
          </p>
          <div className="flex justify-center items-center space-x-4 mb-8">
            <span className="text-sm text-gray-500">14-day free trial</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">No credit card required</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? "border-blue-500 shadow-xl scale-105"
                    : "border-gray-200 shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== "Free" && (
                      <span className="text-gray-500 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.buttonVariant === "default"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose FlowFin?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern businesses that need powerful financial management without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I switch plans at any time?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate any billing adjustments.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Is my financial data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use bank-level encryption and security measures to protect your data.
                Your information is never shared with third parties without your consent.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Do you offer customer support?
              </h3>
              <p className="text-gray-600">
                Yes, all plans include customer support. Professional and Enterprise plans get priority
                support with faster response times.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                You can cancel your subscription at any time. There are no cancellation fees,
                and you'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Financial Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust FlowFin for their accounting needs.
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}