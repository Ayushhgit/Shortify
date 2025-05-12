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

const LayoutWrapper = ({ children }) => {
  const location = useLocation();

  const hideLayoutPaths = ["/shortify"];
  const shouldHideLayout = hideLayoutPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {!shouldHideLayout && <Header />}
      <main className={shouldHideLayout ? "flex-grow" : "flex-grow pt-28"}>
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
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/use-cases/creators" element={<CreatorsUseCase />} />
          <Route path="/use-cases/educators" element={<EducatorsUseCase />} />
          <Route path="/shortify" element={<ShortifyPage />} />
          <Route path="/features/summarizer" element={<Summarizer />} />
          <Route path="/features/shorts-generator" element={<ShortsGenerator />} />
          <Route path="/features/pdf-summarizer" element={<PdfSummarizer />} />
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
}

export default App;
