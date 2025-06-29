import React from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Summarizer from "./pages/Summarizer";
import ShortsGenerator from "./pages/ShortsGenerator";
import PdfSummarizer from "./pages/PdfSummarizer";
import ShortifyPage from "./pages/ShortifyPage";
import Pricing from "./pages/Pricing";
import CreatorsUseCase from "./pages/CreatorsUseCase";
import EducatorsUseCase from "./pages/EducatorsUseCase";
import CorporateSection from "./pages/CorporateUseCase";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ArticleSummarizer from "./pages/ArticleSummarizer";
import CoverLetterGenerator from "./pages/CoverLetterGenerator";
import AssignmentHelper from "./pages/AssignmentHelper";
import ResearchAssistantChat from "./pages/ResearchAssistant";
import LinkwiseAI from "./pages/LinkwiseAI";
import EDAUploader from "./pages/EDAUploader";
import QuizGenerator from "./pages/QuizGenerator";
import ClipGenerator from "./pages/ClipGenerator";
import InterviewPrepAssistant from "./pages/InterviewPrepAssistant";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOService from "./pages/TOS";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";


const LayoutWrapper = ({ children }) => {
  const location = useLocation();

  // Define paths where Header and Footer should be hidden
  const hideLayoutPaths = [
    // Core app pages (full-screen experiences)
    "/",
    "/shortify",
    "/pricing",
    
    // Feature pages (focus on functionality)
    "/features/pdf-summarizer",
    "/features/shorts-generator",
    "/features/summarizer",
    "/features/resume-analyzer",
    "/features/article-summarizer",
    "/features/cover-letter-generator",
    "/features/assignment-helper",
    "/features/research-assistant",
    "/features/linkwise-ai",
    "/features/eda",
    "/features/quiz-generator",
    "/features/clip-generator",
    "/features/interview-prep-assistant",
    
    // User account pages
    "/profile",
    "/settings",

    "/use-cases/creators",
    "/use-cases/educators",
    "/use-cases/corporate",
  ];
  
  // Check if current path should hide layout
  // Also hide layout for 404 pages (any path not defined in routes)
  const isKnownRoute = [
 
    "/refund-policy",
    "/terms-of-service",
    "/privacy-policy",
    ...hideLayoutPaths
  ].includes(location.pathname);
  
  const shouldHideLayout = hideLayoutPaths.includes(location.pathname) || !isKnownRoute;

  // Add dynamic class for layout spacing
  const mainClasses = shouldHideLayout 
    ? "flex-grow" 
    : "flex-grow pt-28";

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {!shouldHideLayout && <Header />}
      <main className={mainClasses}>
        {children}
      </main>
      {!shouldHideLayout && <Footer />}
      <Chatbot />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper>
        <Routes>
          {/* Home and Marketing Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Use Case Pages */}
          <Route path="/use-cases/creators" element={<CreatorsUseCase />} />
          <Route path="/use-cases/educators" element={<EducatorsUseCase />} />
          <Route path="/use-cases/corporate" element={<CorporateSection />} />
          
          {/* Core App */}
          <Route path="/shortify" element={<ShortifyPage />} />
          
          {/* Feature Pages - Standardized kebab-case URLs */}
          <Route path="/features/summarizer" element={<Summarizer />} />
          <Route path="/features/shorts-generator" element={<ShortsGenerator />} />
          <Route path="/features/pdf-summarizer" element={<PdfSummarizer />} />
          <Route path="/features/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="/features/article-summarizer" element={<ArticleSummarizer />} />
          <Route path="/features/cover-letter-generator" element={<CoverLetterGenerator />} />
          <Route path="/features/notes-generator" element={<AssignmentHelper />} />
          <Route path="/features/research-assistant" element={<ResearchAssistantChat />} />
          <Route path="/features/quiz-generator" element={<QuizGenerator />} />
          <Route path="/features/clip-generator" element={<ClipGenerator />} />
          <Route path="/features/linkwise-ai" element={<LinkwiseAI />} />
          <Route path="/features/eda" element={<EDAUploader />} />
          <Route path="/features/interview-prep-assistant" element={<InterviewPrepAssistant />} />
          
          {/* User Account Pages */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Legal Pages */}
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/terms-of-service" element={<TermsOService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          
          {/* 404 Catch-all - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
}

export default App;