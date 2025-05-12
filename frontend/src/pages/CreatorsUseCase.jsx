import { useState } from "react";
import { 
  Link,Youtube,Scissors,Download,Share2,Clock,TrendingUp,Repeat,CheckCircle,Loader
} from "lucide-react";

export default function CreatorsUseCase() {
  const [activeStep, setActiveStep] = useState(1);
  
  const steps = [
    {
      id: 1,
      title: "Paste YouTube Link",
      description: "Simply copy and paste the URL of any YouTube video you want to transform.",
      icon: <Link className="w-8 h-8" />
    },
    {
      id: 2,
      title: "Generate Clips",
      description: "Our AI analyzes the video and automatically generates viral-worthy short clips.",
      icon: <Scissors className="w-8 h-8" />
    },
    {
      id: 3,
      title: "Download & Edit",
      description: "Review the generated clips, make any tweaks if needed, and download in preferred format.",
      icon: <Download className="w-8 h-8" />
    },
    {
      id: 4,
      title: "Share Everywhere",
      description: "Publish your clips to TikTok, Instagram Reels, YouTube Shorts and more with one click.",
      icon: <Share2 className="w-8 h-8" />
    }
  ];
  
  const benefits = [
    {
      id: 1,
      title: "Save Hours of Work",
      description: "What used to take hours now happens in minutes. Focus on creating, not editing.",
      icon: <Clock className="w-6 h-6 text-indigo-600" />
    },
    {
      id: 2,
      title: "Grow Audience Faster",
      description: "Consistently publish viral-worthy shorts to rapidly expand your reach and following.",
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />
    },
    {
      id: 3,
      title: "Repurpose Old Content",
      description: "Breathe new life into your content library by transforming old videos into fresh clips.",
      icon: <Repeat className="w-6 h-6 text-indigo-600" />
    }
  ];
  
  const useCases = [
    "YouTube creators looking to expand to short-form content",
    "Podcasters wanting to share highlights on social media",
    "Educators making digestible learning snippets",
    "Businesses repurposing webinars and presentations"
  ];

  return (
    <div className="w-full bg-gradient-to-b from-white to-indio-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Transform Long Videos Into <span className="text-green-400">Viral Shorts</span> With AI
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Shortify helps content creators automatically convert long-form videos into 
            engaging short-form clips that are perfect for TikTok, Instagram, and YouTube Shorts.
          </p>
        </div>
        
        {/* How It Works Section */}
        <div className="mb-24">
          <h3 className="text-2xl font-bold text-center mb-12">How Shortify Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Steps Visualization */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="flex flex-col space-y-6">
                {steps.map((step) => (
                  <div 
                    key={step.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 cursor-pointer ${
                      activeStep === step.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className={`p-3 rounded-full ${
                      activeStep === step.id ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"
                    }`}>
                      {step.icon}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">
                        {step.id}. {step.title}
                      </h4>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual Representation */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 md:p-8 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white/20 rounded-full">
                    {steps[activeStep - 1].icon}
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-3">
                  Step {activeStep}: {steps[activeStep - 1].title}
                </h4>
                <p className="text-white/90 max-w-md">
                  {steps[activeStep - 1].description}
                </p>
                
                {/* Visualization placeholder - would be replaced with actual graphics in production */}
                <div className="mt-8 relative">
                  <div className="w-full max-w-xs mx-auto aspect-video bg-black/30 rounded-lg flex items-center justify-center">
                    {activeStep === 1 && (
                      <div className="flex flex-col items-center">
                        <Youtube className="w-12 h-12 text-red-400" />
                        <div className="mt-2 w-3/4 h-8 bg-white/20 rounded animate-pulse"></div>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="flex space-x-2">
                        <div className="w-1/3 h-24 bg-white/20 rounded"></div>
                        <Loader className="w-12 h-22 text-grey-700" />
                        <div className="w-1/3 h-24 bg-white/30 rounded animate-pulse"></div>
                        <div className="w-1/3 h-24 bg-white/20 rounded"></div>
                      </div>
                    )}
                    {activeStep === 3 && (
                      <div className="flex flex-col items-center">
                        <Download className="w-12 h-12 text-green-300" />
                        <div className="mt-2 flex space-x-2">
                          <div className="h-6 w-16 bg-white/20 rounded"></div>
                          <div className="h-6 w-16 bg-white/20 rounded"></div>
                        </div>
                      </div>
                    )}
                    {activeStep === 4 && (
                      <div className="flex space-x-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-pink-400"></div>
                        <div className="w-8 h-8 rounded-full bg-blue-400"></div>
                        <div className="w-8 h-8 rounded-full bg-red-400"></div>
                        <Share2 className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center mb-12">Why Content Creators Love Shortify</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div 
                key={benefit.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
              >
                <div className="p-3 bg-indigo-100 rounded-full w-fit mb-4">
                  {benefit.icon}
                </div>
                <h4 className="text-xl font-semibold mb-3 text-gray-900">{benefit.title}</h4>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Use Cases Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 md:p-8 lg:p-12">
              <h3 className="text-2xl font-bold mb-6">Perfect For All Content Creators</h3>
              <div className="space-y-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-gray-700">{useCase}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <a href='/features/shorts-generator'><button className="bg-gradient-to-r from-indigo-600 to-purple-600   hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-full transition-colors">
                  Try Shortify for Free
                </button> </a>
                <p className="text-sm px-7 text-gray-500 mt-2">Limited period only.</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-6 md:p-8 flex items-center justify-center">
              <div className="max-w-md text-center text-white">
                <h4 className="text-xl font-bold mb-4">
                  Save 15+ Hours Weekly On Content Creation
                </h4>
                <p className="text-white/80 mb-6">
                  Join thousands of content creators who are scaling their social media presence effortlessly 
                  with Shortify's AI-powered video transformation.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                      <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">+2.4k users</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.0 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-sm font-medium">4.6/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}