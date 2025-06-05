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
  Target,
  Heart,
  Lightbulb,
  Award,
  Linkedin,
  Twitter,
  Github,
  Mail,
} from "lucide-react";
import Image from "next/image";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About FlowFin
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to simplify financial management for businesses of all sizes. 
              FlowFin combines powerful accounting tools with intuitive design to help you 
              take control of your finances.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                At FlowFin, we believe that financial management shouldn't be complicated. 
                Our mission is to democratize access to professional-grade accounting tools, 
                making them accessible and affordable for everyone.
              </p>
              <p className="text-gray-600 text-lg">
                We're building a platform that grows with your business, from startup to enterprise, 
                providing the insights and tools you need to make informed financial decisions.
              </p>
            </div>
            <div className="lg:w-1/2">
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-200">
                <Image
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
                  alt="Team collaboration"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do at FlowFin, from product development 
              to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Security First",
                description: "Your financial data is protected with bank-level security and encryption.",
              },
              {
                icon: <Lightbulb className="w-8 h-8" />,
                title: "Innovation",
                description: "We continuously innovate to bring you the latest in financial technology.",
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Customer Focus",
                description: "Every feature we build is designed with our users' needs in mind.",
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Simplicity",
                description: "Complex financial tasks made simple through intuitive design.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center"
              >
                <div className="text-blue-600 mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Our Story
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                FlowFin was born from the frustration of dealing with complex, 
                expensive accounting software that didn't meet the needs of modern businesses.
              </p>
            </div>

            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="text-4xl font-bold text-blue-600 mb-2">2024</div>
                  <h3 className="text-xl font-semibold mb-3">Development</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="text-gray-600">
                    Spent the year in intensive development, building our core platform 
                    with a focus on user experience and security. Conducted extensive 
                    beta testing with select businesses to refine our features.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="text-4xl font-bold text-blue-600 mb-2">June 2025</div>
                  <h3 className="text-xl font-semibold mb-3">Official Launch</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="text-gray-600">
                    Launching FlowFin to the public on June 13th, 2025. After months of 
                    rigorous testing and refinement, we're ready to help businesses 
                    transform their financial management with our innovative platform.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="text-4xl font-bold text-blue-600 mb-2">Future</div>
                  <h3 className="text-xl font-semibold mb-3">What's Next</h3>
                </div>
                <div className="md:w-2/3">
                  <p className="text-gray-600">
                    We're continuously expanding our platform with AI-powered insights, 
                    advanced reporting, and integrations with the tools you already use. 
                    The future of financial management starts here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meet Our Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              The passionate individuals behind FlowFin who are dedicated to 
              revolutionizing financial management for businesses everywhere.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Aman Mohamed Ali",
                role: "Co-Founder & CEO",
                description: "Visionary leader driving FlowFin's mission to simplify financial management for modern businesses.",
                gradient: "from-blue-500 to-blue-700",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  github: "#",
                  email: "aman@flowfin.com"
                }
              },
              {
                name: "Mohammed Shahbaz",
                role: "Co-Founder & CTO",
                description: "Technical expert focused on building scalable and secure financial solutions with cutting-edge technology.",
                gradient: "from-purple-500 to-purple-700",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  github: "#",
                  email: "shahbaz@flowfin.com"
                }
              },
              {
                name: "AbduRahman",
                role: "Lead Developer",
                description: "Full-stack developer passionate about creating intuitive user experiences and seamless interfaces.",
                gradient: "from-green-500 to-green-700",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  github: "#",
                  email: "abdur@flowfin.com"
                }
              },
              {
                name: "Mohammed Nahin",
                role: "Backend Developer",
                description: "Backend specialist ensuring robust and reliable platform performance with enterprise-grade security.",
                gradient: "from-orange-500 to-orange-700",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  github: "#",
                  email: "nahin@flowfin.com"
                }
              },
            ].map((member, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl"></div>
                
                {/* Profile Image */}
                <div className="relative mb-6">
                  <div className={`w-28 h-28 bg-gradient-to-br ${member.gradient} rounded-full mx-auto flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-3xl font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border-4 border-white shadow-md"></div>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-4 text-sm uppercase tracking-wide">{member.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{member.description}</p>
                  
                  {/* Social Links */}
                  <div className="flex justify-center space-x-3">
                    <a 
                      href={member.social.linkedin} 
                      className="w-10 h-10 bg-gray-100 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-300 group/social"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 text-gray-600 group-hover/social:text-white" />
                    </a>
                    <a 
                      href={member.social.twitter} 
                      className="w-10 h-10 bg-gray-100 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors duration-300 group/social"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-4 h-4 text-gray-600 group-hover/social:text-white" />
                    </a>
                    <a 
                      href={member.social.github} 
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors duration-300 group/social"
                      aria-label="GitHub"
                    >
                      <Github className="w-4 h-4 text-gray-600 group-hover/social:text-white" />
                    </a>
                    <a 
                      href={`mailto:${member.social.email}`} 
                      className="w-10 h-10 bg-gray-100 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors duration-300 group/social"
                      aria-label="Email"
                    >
                      <Mail className="w-4 h-4 text-gray-600 group-hover/social:text-white" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose FlowFin?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We've built FlowFin to address the real challenges businesses face 
              when managing their finances.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calculator className="w-6 h-6" />,
                title: "Comprehensive Tools",
                description: "Everything you need for financial management in one platform.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Team Collaboration",
                description: "Work seamlessly with your team and accountant.",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Real-time Insights",
                description: "Get instant visibility into your financial performance.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Bank-level Security",
                description: "Your data is protected with enterprise-grade security.",
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Award-winning Support",
                description: "Get help when you need it from our expert support team.",
              },
              {
                icon: <PieChart className="w-6 h-6" />,
                title: "Smart Analytics",
                description: "AI-powered insights to help you make better decisions.",
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

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Financial Management?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust FlowFin to manage their finances. 
            Start your free trial today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center px-6 py-3 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Get Started Free
              <ArrowUpRight className="ml-2 w-4 h-4" />
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 text-white border border-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}