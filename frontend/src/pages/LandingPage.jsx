import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // 💡 Auto-scroll to Contact section after 60 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/contact-us");
    }, 60000); // 60000ms = 60 seconds

    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  // 💡 Auto-redirect logic removed to allow access to Landing Page. 
  // User can manually navigate to dashboard via Login button or new Dashboard button if we add one.

  const handleFeature = () => {
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHome = () => {
    const heroSection = document.getElementById("hero");
    heroSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleContact = () => {
    const contactSection = document.getElementById("contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 font-sans">
      {/* NAVBAR */}
      <header className="w-full bg-white shadow-lg rounded-b-3xl sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto flex justify-between items-center py-6 px-8">
          <h1 className="text-3xl font-extrabold text-[#003D99] tracking-tight" onClick={()=>navigate("/")}>
            PAPERNEST
          </h1>

          <div className="hidden md:flex gap-10 text-base font-bold text-blue-900">
            <button
              onClick={handleHome}
              className=" cursor-pointer hover:text-blue-600 transition-colors"
            >
              HOME
            </button>
            <div
              onClick={handleFeature}
              className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"
            >
              FEATURES
            </div>
            <div
              onClick={handleContact}
              className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"
            >
              CONTACT
            </div>
          </div>

          <button
            className="md:hidden text-blue-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex flex-col gap-4 text-base font-bold text-blue-900">
              <button
                onClick={handleHome}
                className="text-left hover:text-blue-600"
              >
                HOME
              </button>
              <button
                onClick={handleFeature}
                className="text-left hover:text-blue-600"
              >
                FEATURES
              </button>
              <button
                onClick={handleContact}
                className="text-left hover:text-blue-600"
              >
                CONTACT
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}

      <section
        id="hero"
        className="max-w-6xl mx-auto flex flex-col items-center text-center py-20 px-6"
      >
        <div className="flex flex-col items-center">
          <div className="text-6xl md:text-8xl font-extrabold leading-tight mt-8">
            <p className="text-[#1D378A] mb-2">GET YOUR PREP DONE</p>
            <div className="text-6xl md:text-7xl font-extrabold leading-tight mt-8">
              <p className="text-blue-600">SMARTLY & EFFICIENTLY</p>
            </div>
          </div>

          <p className="mt-8 text-xl md:text-2xl text-gray-600 max-w-3xl leading-relaxed">
            Join thousands of students and ace your exams with our curated
            resources and smart tools.
          </p>

          <button
            className="mt-14 bg-blue-600 hover:bg-blue-700 text-white font-bold px-16 py-5 rounded-full text-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            onClick={() => navigate("/login-page")}
          >
            Login   
          </button>
        </div>
      </section>

      {/* RESOURCES SECTION */}
      <section className="w-full bg-gradient-to-br from-[#003D99] to-[#0052CC] py-24 px-6 shadow-2xl">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Access Comprehensive Resources
          </h2>
          <p className="text-blue-100 text-xl mb-14 max-w-2xl mx-auto">
            Everything you need to succeed, organized and ready for you
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-10">
            <div className="flex flex-col items-center p-10 bg-white/15 backdrop-blur-sm rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:bg-white/20 border border-white/20">
              <div className="bg-white/20 p-4 rounded-xl mb-4">
                <BookOpen className="text-white" size={48} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Papers</h3>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                Download and practice previous year question papers.
              </p>
              <button className="mt-2 bg-white text-blue-900 font-bold px-8 py-3 rounded-full text-lg hover:bg-blue-50 transition-all shadow-lg" onClick={() => navigate("/login-page")}>
                View Papers
              </button>
            </div>

            <div className="flex flex-col items-center p-10 bg-white/15 backdrop-blur-sm rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:bg-white/20 border border-white/20">
              <div className="bg-white/20 p-4 rounded-xl mb-4">
                <Sparkles className="text-white" size={48} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Notes</h3>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                Get concise, high-quality study notes for quick revision.
              </p>
              <button className="mt-2 bg-white text-blue-900 font-bold px-8 py-3 rounded-full text-lg hover:bg-blue-50 transition-all shadow-lg" onClick={() => navigate("/login-page")}>
                View Notes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MADE FOR USERS SECTION */}
      <section className="max-w-6xl mx-auto py-24 px-6">
        <h2 className="text-5xl md:text-7xl font-extrabold text-[#1D378A] text-center mb-8">
          Designed For <span className="text-blue-600">Your Success</span>
        </h2>
        <p className="text-center text-xl text-gray-600 mb-20 max-w-2xl mx-auto">
          Powerful features that make learning easier and more effective
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-10 border-2 border-blue-200 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center mb-5">
              <div className="bg-blue-50 p-3 rounded-xl mr-4">
                <BookOpen size={36} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Conceptual Clarity
              </h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Detailed explanations and smart learning paths help you grasp
              tough concepts easily. Focus on understanding, not just
              memorizing.
            </p>
          </div>

          <div className="p-10 border-2 border-blue-200 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center mb-5">
              <div className="bg-blue-50 p-3 rounded-xl mr-4">
                <Clock size={36} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Smart Time-Saving
              </h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Stop wasting time searching. All resources are centralized and
              organized for maximum efficiency and quick access.
            </p>
          </div>

          <div className="p-10 border-2 border-blue-200 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center mb-5">
              <div className="bg-blue-50 p-3 rounded-xl mr-4">
                <Sparkles size={36} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Targeted Practice
              </h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Practice only the most relevant questions and topics, ensuring
              your study time is always high-impact.
            </p>
          </div>

          <div className="p-10 border-2 border-blue-200 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center mb-5">
              <div className="bg-blue-50 p-3 rounded-xl mr-4">
                <Users size={36} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Community & Collaboration
              </h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Connect with fellow students, share insights, and study together
              effectively, just like a virtual noticeboard.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="w-full bg-white py-24 px-6 border-y border-gray-200"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-extrabold text-[#1D378A] text-center mb-6">
            FEATURES
          </h2>
          <p className="text-center text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
            Built with the tools you need to excel in your studies
          </p>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center p-8 border-t-4 border-blue-600 rounded-2xl shadow-xl text-center bg-gradient-to-b from-white to-blue-50/30 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="bg-blue-100 p-4 rounded-xl mb-5">
                <Sparkles size={48} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Smart Tools
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Utilize intelligent tools for quick learning and customized
                study plans.
              </p>
            </div>

            <div className="flex flex-col items-center p-8 border-t-4 border-blue-600 rounded-2xl shadow-xl text-center bg-gradient-to-b from-white to-blue-50/30 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="bg-blue-100 p-4 rounded-xl mb-5">
                <Clock size={48} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Time Saver
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Spend less time organizing and more time studying with efficient
                content delivery.
              </p>
            </div>

            <div className="flex flex-col items-center p-8 border-t-4 border-blue-600 rounded-2xl shadow-xl text-center bg-gradient-to-b from-white to-blue-50/30 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="bg-blue-100 p-4 rounded-xl mb-5">
                <BookOpen size={48} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Structured Content
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                All notes and papers are logically organized by subject and
                topic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DESIGNED FOR SECTION */}
      <section className="max-w-6xl mx-auto py-24 px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold text-[#1D378A] mb-6">
          Designed For <span className="text-blue-600">Everyone</span>
        </h2>
        <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
          Whether you're teaching or learning, we have the right tools for you
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-10">
          <div className="flex flex-col items-center p-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl max-w-md w-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-blue-200">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Users size={40} className="text-white" />
            </div>
            <h3 className="text-4xl font-bold text-blue-900 mb-4">Teacher</h3>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
              Access resources for better teaching and student support.
            </p>
            <button className="flex items-center bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            onClick={() => navigate("/login-page")}>
              Learn More <ArrowRight size={20} className="ml-2" />
            </button>
          </div>

          <div className="flex flex-col items-center p-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl max-w-md w-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-blue-200">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <BookOpen size={40} className="text-white" />
            </div>
            <h3 className="text-4xl font-bold text-blue-900 mb-4">Student</h3>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
              Your one-stop platform for all study materials and exam prep.
            </p>
            <button className="flex items-center bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            onClick={() => navigate("/login-page", { state: { role: "student" } })}>
              Start Studying <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT US & CTA */}
      <section
        id="contact"
        className="w-full py-24 px-6 bg-gradient-to-br from-[#F0F5FF] to-blue-50"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold text-[#1D378A] mb-6">
            Have a Question?
          </h2>
          <p className="text-2xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
            Reach out to us, we're here to help you succeed.
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-14 py-5 rounded-full text-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          onClick={() => navigate("/contact-us")}>
            Contact Us
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-[#080E2C] to-[#050A1F] text-white rounded-t-3xl mt-10 px-6 py-16 md:px-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 border-b border-white/20 pb-12 gap-8">
            <button className="border-2 text-lg md:text-xl lg:text-2xl border-white/40 px-8 md:px-10 py-4 md:py-5 rounded-xl flex items-center gap-3 md:gap-4 hover:bg-white/10 transition-all font-semibold hover:border-white/60 w-full md:w-auto justify-center lg:justify-start">
              Our community
              <ArrowRight size={22} className="hidden md:inline lg:inline" />
            </button>

            <div className="grid grid-cols-2 gap-10 md:gap-12 lg:gap-20 w-full lg:w-auto text-base md:text-lg font-medium">
              <div className="flex flex-col gap-3">
                <span className="opacity-70 hover:opacity-100 cursor-pointer transition-opacity">
                  Terms of service
                </span>
                <span className="opacity-70 hover:opacity-100 cursor-pointer transition-opacity">
                  Support
                </span>
                <span className="opacity-70 hover:opacity-100 cursor-pointer transition-opacity">
                  Privacy policy
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-bold mb-2 text-lg md:text-xl">
                  Follow us
                </span>
                <span className="opacity-70 hover:opacity-100 hover:underline cursor-pointer transition-opacity">
                  Instagram
                </span>
                <span className="opacity-70 hover:opacity-100 hover:underline cursor-pointer transition-opacity">
                  LinkedIn
                </span>
                <span className="opacity-70 hover:opacity-100 hover:underline cursor-pointer transition-opacity">
                  Facebook
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold tracking-wider lg:tracking-widest leading-none mb-6">
              PAPERNEST
            </h1>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;