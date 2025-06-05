import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageCircle,
  Play,
  Search,
  Star,
  Users,
  Video,
  Zap,
  Calendar,
  Clock,
  Tag,
  Bookmark,
  Globe,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Image from "next/image";

export default function Resources() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Resources & Support
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to get the most out of FlowFin. From getting started guides 
              to advanced tutorials, we've got you covered.
            </p>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documentation, guides, and tutorials..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Documentation",
                description: "Comprehensive guides and API references",
                count: "50+ articles",
                color: "blue",
                href: "#documentation",
              },
              {
                icon: <Video className="w-8 h-8" />,
                title: "Video Tutorials",
                description: "Step-by-step video walkthroughs",
                count: "25+ videos",
                color: "green",
                href: "#tutorials",
              },
              {
                icon: <HelpCircle className="w-8 h-8" />,
                title: "Help Center",
                description: "Frequently asked questions and answers",
                count: "100+ FAQs",
                color: "purple",
                href: "#help",
              },
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: "Community",
                description: "Connect with other FlowFin users",
                count: "1000+ members",
                color: "orange",
                href: "#community",
              },
            ].map((category, index) => (
              <a
                key={index}
                href={category.href}
                className="group block p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-${category.color}-100 rounded-xl flex items-center justify-center mb-6 text-${category.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{category.count}</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 bg-gray-50" id="documentation">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Getting Started</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              New to FlowFin? Start here with our comprehensive onboarding guides.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Quick Start Guide",
                description: "Get up and running with FlowFin in under 10 minutes",
                duration: "5 min read",
                difficulty: "Beginner",
                popular: true,
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Setting Up Your Team",
                description: "Learn how to invite team members and set permissions",
                duration: "8 min read",
                difficulty: "Beginner",
                popular: false,
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "First Invoice Setup",
                description: "Create and send your first professional invoice",
                duration: "12 min read",
                difficulty: "Beginner",
                popular: true,
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Chart of Accounts",
                description: "Customize your chart of accounts for your business",
                duration: "15 min read",
                difficulty: "Intermediate",
                popular: false,
              },
              {
                icon: <Download className="w-6 h-6" />,
                title: "Data Import Guide",
                description: "Import existing financial data from other platforms",
                duration: "20 min read",
                difficulty: "Intermediate",
                popular: false,
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: "Advanced Features",
                description: "Unlock the full potential of FlowFin's advanced tools",
                duration: "25 min read",
                difficulty: "Advanced",
                popular: true,
              },
            ].map((guide, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative">
                {guide.popular && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Popular
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {guide.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{guide.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{guide.duration}</span>
                      <span>•</span>
                      <Tag className="w-3 h-3" />
                      <span>{guide.difficulty}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  Read Guide
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-20 bg-white" id="tutorials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Video Tutorials</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Learn FlowFin visually with our comprehensive video tutorial library.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "FlowFin Overview",
                description: "Complete walkthrough of FlowFin's main features",
                duration: "12:34",
                views: "2.5K",
                thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
              },
              {
                title: "Creating Your First Invoice",
                description: "Step-by-step guide to invoice creation and management",
                duration: "8:45",
                views: "1.8K",
                thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
              },
              {
                title: "Setting Up Automated Workflows",
                description: "Automate repetitive tasks with smart workflows",
                duration: "15:22",
                views: "1.2K",
                thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
              },
              {
                title: "Financial Reporting Deep Dive",
                description: "Generate and customize financial reports",
                duration: "18:56",
                views: "980",
                thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
              },
              {
                title: "Mobile App Tutorial",
                description: "Using FlowFin on your mobile device",
                duration: "9:12",
                views: "1.5K",
                thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80",
              },
              {
                title: "Advanced Security Settings",
                description: "Configure security features and user permissions",
                duration: "11:33",
                views: "756",
                thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
              },
            ].map((video, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="relative">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    width={400}
                    height={225}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-800 ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">{video.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{video.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{video.views} views</span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Watch Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Center */}
      <section className="py-20 bg-gray-50" id="help">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Find quick answers to common questions about FlowFin.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  category: "Getting Started",
                  questions: [
                    "How do I create my first account?",
                    "What information do I need to get started?",
                    "How do I invite team members?",
                    "Can I import data from other platforms?",
                  ],
                },
                {
                  category: "Billing & Pricing",
                  questions: [
                    "Is FlowFin really free during launch?",
                    "What happens after the launch period?",
                    "Are there any hidden fees?",
                    "Can I cancel anytime?",
                  ],
                },
                {
                  category: "Features & Functionality",
                  questions: [
                    "What types of reports can I generate?",
                    "How does the AI categorization work?",
                    "Can I customize my dashboard?",
                    "Is there a mobile app available?",
                  ],
                },
                {
                  category: "Security & Privacy",
                  questions: [
                    "How is my financial data protected?",
                    "Do you offer two-factor authentication?",
                    "Where is my data stored?",
                    "Can I export my data?",
                  ],
                },
              ].map((category, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">{category.category}</h3>
                  <div className="space-y-3">
                    {category.questions.map((question, qIndex) => (
                      <a
                        key={qIndex}
                        href="#"
                        className="block text-gray-600 hover:text-blue-600 transition-colors text-sm py-2 border-b border-gray-100 last:border-b-0"
                      >
                        {question}
                      </a>
                    ))}
                  </div>
                  <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-flex items-center gap-1">
                    View All
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-20 bg-white" id="community">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Join Our Community</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Connect with other FlowFin users, share tips, and get help from the community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: "Discord Community",
                description: "Join our active Discord server for real-time discussions and support.",
                members: "1,200+ members",
                action: "Join Discord",
                color: "purple",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "User Forum",
                description: "Share ideas, ask questions, and help other users in our forum.",
                members: "800+ posts",
                action: "Visit Forum",
                color: "blue",
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Monthly Webinars",
                description: "Join our monthly webinars for tips, updates, and Q&A sessions.",
                members: "Next: Jan 15",
                action: "Register Now",
                color: "green",
              },
            ].map((community, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 text-center">
                <div className={`w-16 h-16 bg-${community.color}-100 rounded-full flex items-center justify-center mx-auto mb-6 text-${community.color}-600`}>
                  {community.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{community.title}</h3>
                <p className="text-gray-600 mb-4">{community.description}</p>
                <p className="text-sm text-gray-500 mb-6">{community.members}</p>
                <a
                  href="#"
                  className={`inline-flex items-center justify-center px-6 py-3 bg-${community.color}-600 text-white rounded-lg hover:bg-${community.color}-700 transition-colors font-medium`}
                >
                  {community.action}
                  <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Need Personal Support?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Our support team is here to help you succeed with FlowFin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Mail className="w-6 h-6" />,
                title: "Email Support",
                description: "Get detailed help via email",
                contact: "support@flowfin.com",
                response: "Response within 24 hours",
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "Live Chat",
                description: "Chat with our support team",
                contact: "Available 9 AM - 6 PM EST",
                response: "Instant response",
              },
              {
                icon: <Phone className="w-6 h-6" />,
                title: "Phone Support",
                description: "Speak directly with our team",
                contact: "+1 (555) 123-4567",
                response: "Available during business hours",
              },
            ].map((support, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {support.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{support.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{support.description}</p>
                <p className="font-medium text-gray-800 mb-2">{support.contact}</p>
                <p className="text-xs text-gray-500">{support.response}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
            Have all the resources you need? Start your FlowFin journey today with 
            full access to all features during our launch period.
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
              href="/features"
              className="inline-flex items-center justify-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}