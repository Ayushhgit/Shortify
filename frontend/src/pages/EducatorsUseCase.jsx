import React, { useState } from "react";
import { ChevronRight, Clock, Film, Download, BookOpen, Users, Lightbulb, Presentation, RefreshCw, Zap } from "lucide-react";


// Step Component 
const WorkflowStep = ({ number, title, description, icon }) => {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-4">
        {number}
      </div>
      <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
};

// Benefit Card Component
const BenefitCard = ({ title, description, icon }) => {
  return (
    <div className="flex items-start p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <div className="bg-blue-50 p-3 rounded-lg mr-4 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

// Use Case Component
const UseCase = ({ title, icon, description }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`p-5 rounded-lg transition-all duration-300 ${
        isHovered ? "bg-gradient-to-t from-indigo-600 to-purple-600 text-white" : "bg-white text-gray-800"
      } cursor-pointer shadow-sm hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`mb-3 ${isHovered ? "text-white" : "text-blue-600"}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className={`text-sm ${isHovered ? "text-blue-50" : "text-gray-600"}`}>
        {description}
      </p>
    </div>
  );
};

// Main Educator Component
export default function EducatorUseCase() {
  return (
    <div className="w-full py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Transform Teaching with Short<span className="text-green-400">ify</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Create engaging microlearning content from any educational video in minutes, not hours
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 text-center">
            How Educators Use Shortify
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            <WorkflowStep 
              number="1"
              title="Paste Video Link"
              description="Simply paste the URL of any educational YouTube video you want to transform"
              icon={<Film className="h-6 w-6 text-blue-600" />}
            />
            <WorkflowStep 
              number="2"
              title="AI-Generated Summary"
              description="Shortify automatically analyzes and creates concise summaries with key learning points"
              icon={<Lightbulb className="h-6 w-6 text-blue-600" />}
            />
            <WorkflowStep 
              number="3"
              title="Download & Share Clips"
              description="Download bite-sized video clips and summaries ready to share with your students"
              icon={<Download className="h-6 w-6 text-blue-600" />}
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 text-center">
            Benefits for Educators
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitCard 
              title="Save Preparation Time"
              description="Reduce hours of manual video review and note-taking to just minutes with AI-powered summaries"
              icon={<Clock className="h-8 w-8 text-blue-600" />}
            />
            <BenefitCard 
              title="Create Microlearning Content"
              description="Transform lengthy lectures into digestible, focused learning modules that improve retention"
              icon={<Zap className="h-8 w-8 text-blue-600" />}
            />
            <BenefitCard 
              title="Boost Student Engagement"
              description="Capture attention with concise, high-impact video clips that emphasize key concepts"
              icon={<Users className="h-8 w-8 text-blue-600" />}
            />
            <BenefitCard 
              title="Reuse & Repurpose Content"
              description="Breathe new life into existing lecture videos by extracting the most valuable segments"
              icon={<RefreshCw className="h-8 w-8 text-blue-600" />}
            />
          </div>
        </div>

        {/* Use Cases Section */}
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-8 text-center">
            Popular Teaching Approaches
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UseCase
              title="Flipped Classrooms"
              description="Provide concise pre-class content for students to review before discussions"
              icon={<Presentation />}
            />
            <UseCase
              title="Microlearning"
              description="Create focused learning modules on specific concepts or skills"
              icon={<BookOpen />}
            />
            <UseCase
              title="Lecture Recaps"
              description="Summarize key points from previous lessons for quick review"
              icon={<RefreshCw />}
            />
            <UseCase
              title="Student Projects"
              description="Empower students to create and share their own video summaries"
              icon={<Users />}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
         <a href='/features/summarizer'> <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center mx-auto">
            Start Learning
            <ChevronRight className="ml-2 h-5 w-5" />
          </button> </a>
        </div>
      </div>
    </div>
  );
}

