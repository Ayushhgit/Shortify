
import React, { useState } from "react";
import {
  Link,Brain,FileText,Share2,Clock,Database,Users,BookOpen,Award,MessageSquare,UserPlus,Library,ClipboardList,Bell,
} from "lucide-react";

export default function CorporateSection() {
  const [activeTab, setActiveTab] = useState("how-it-works");

  const tabComponents = {
    "how-it-works": HowItWorksTab,
    "benefits": BenefitsTab,
    "use-cases": UseCasesTab,
  };
  const ActiveTab = tabComponents[activeTab];

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Work Smarter, Not Harder with <span className="text-green-500">AI Summaries</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transform lengthy content into actionable insights. Help your team save time and boost productivity.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-10 border-b border-grey-00">
          <TabButton
            label="How It Works"
            active={activeTab === "how-it-works"}
            onClick={() => setActiveTab("how-it-works")}
            id="how-it-works"
          />
          <TabButton
            label="Benefits"
            active={activeTab === "benefits"}
            onClick={() => setActiveTab("benefits")}
            id="benefits"
          />
          <TabButton
            label="Use Cases"
            active={activeTab === "use-cases"}
            onClick={() => setActiveTab("use-cases")}
            id="use-cases"
          />
        </div>

        {/* Tab Content */}
        <div id={`panel-${activeTab}`} role="tabpanel" className="mt-8">
          <ActiveTab />
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
         <a href="/features/pdf-summarizer"> <button className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Start Now
          </button> </a>
          <p className="mt-3 text-gray-500 text-sm">Start your smart journey today.</p>
        </div>
      </div>
    </section>
  );
}

// Tab Button Component
const TabButton = ({ label, active, onClick, id }) => {
  return (
    <button
      className={`px-6 py-3 font-medium text-base transition-all duration-200 border-b-2 ${
        active
          ? "text-blue-500 border-blue-600"
          : "text-gray-500 border-transparent hover:text-gray-700"
      } px-6 py-2 text-blue-500 rounded-full text-grey-700 font-medium `}
      onClick={onClick}
      role="tab"
      aria-selected={active}
      aria-controls={`panel-${id}`}
    >
      {label}
    </button>
  );
};

// How It Works Tab
const HowItWorksTab = () => {
  const steps = [
    {
      icon: <Link className="w-6 h-6" />,
      title: "Paste Video/PDF Link",
      description: "Upload PDF or paste a YouTube link to begin the summarization process.",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Insight Extraction",
      description: "Our AI scans content to identify key concepts, trends, and important moments.",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Summary + Highlights",
      description: "Receive concise summaries and highlights, with optional video clips of key moments.",
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Share with Team",
      description: "Export and share summaries or video clips with your team via email or Slack.",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <div className="text-blue-600">{step.icon}</div>
            </div>
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                {index + 1}
              </div>
              <h3 className="font-semibold text-gray-800">{step.title}</h3>
            </div>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 md:mb-0 md:mr-6">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Enterprise-Grade Security</h3>
            <p className="text-gray-600">
              All your content is processed with military-grade encryption, and we're SOC 2 and GDPR compliant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Benefits Tab
const BenefitsTab = () => {
  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save Hours of Content Digestion",
      description: "Transform hours of video content or lengthy documents into digestible summaries in minutes.",
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Centralize Knowledge",
      description: "Create a searchable repository of insights from all your company's content.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Simplify Onboarding",
      description: "Help new team members get up to speed quickly with concise summaries of important materials.",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Active Learning",
      description: "Turn passive video watching into active learning with highlights and key takeaways.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {benefits.map((benefit, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
            <div className="text-blue-600">{benefit.icon}</div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{benefit.title}</h3>
            <p className="text-gray-600">{benefit.description}</p>
          </div>
        </div>
      ))}

      <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-400 to-indigo-400 p-6 rounded-xl text-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-4 md:mb-0 md:mr-6">
            <Award className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Boost Team Productivity by up to 40%</h3>
            <p>
              Our customers report significant time savings and improved information retention when using Shortify for
              corporate knowledge management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Use Cases Tab
const UseCasesTab = () => {
  const useCases = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Training Summaries",
      description: "Convert lengthy training videos into concise learning modules.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Meeting Recaps",
      description: "Summarize recorded meetings into actionable highlights.",
    },
    {
      icon: <UserPlus className="w-6 h-6" />,
      title: "Onboarding Kits",
      description: "Create digestible content packages for new team members.",
    },
    {
      icon: <Library className="w-6 h-6" />,
      title: "Knowledge Libraries",
      description: "Build searchable repositories of corporate knowledge.",
    },
    {
      icon: <ClipboardList className="w-6 h-6" />,
      title: "Policy Digest",
      description: "Simplify complex policies into understandable summaries.",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Team Updates",
      description: "Keep everyone informed with essential information only.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {useCases.map((useCase, index) => (
        <div
          key={index}
          className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-px"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <div className="text-blue-600">{useCase.icon}</div>
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">{useCase.title}</h3>
          <p className="text-gray-600 text-sm">{useCase.description}</p>
        </div>
      ))}
    </div>
  );
};
