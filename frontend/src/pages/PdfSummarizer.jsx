import React, { useState, useRef } from "react";
import { Home, Settings, User, Upload, FileText, X, Check, Loader2 } from "lucide-react";
import Toast from "../components/Toast";

export default function PdfSummarizer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const fileInputRef = useRef(null);

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.includes("pdf")) {
        displayToast("Please select a PDF file", "error");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        displayToast("File size exceeds 10MB limit", "error");
        return;
      }

      setFile(selectedFile);
      displayToast("PDF selected successfully!");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (!droppedFile.type.includes("pdf")) {
        displayToast("Please drop a PDF file", "error");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        displayToast("File size exceeds 10MB limit", "error");
        return;
      }
      setFile(droppedFile);
      displayToast("PDF dropped successfully!");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async () => {
    if (!file) {
      displayToast("Please select a PDF file first", "error");
      return;
    }

    try {
      setIsProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSummary("Summary will appear here.");
      displayToast("PDF summarized successfully!");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      displayToast("Error processing PDF. Please try again.", "error");
      console.error("Error:", error);
    }
  };

  const handleClear = () => {
    setFile(null);
    setSummary("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 px-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-xl font-bold text-gray-900">
                Summ<span className="text-green-500">AI</span>ze
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/shortify">
                <button
                  className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition"
                  aria-label="Go to Shortify Home"
                >
                  <Home className="h-5 w-5 text-gray-600" />
                </button>
              </a>
              <a href="/profile">
                <button
                  className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition"
                  aria-label="Go to Profile"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </button>
              </a>
              <button
                className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-30 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Summ<span className="text-green-500">AI</span>ze
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Transform lengthy PDFs into concise, actionable summaries
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center mb-8">
          <div className={`flex items-center ${file ? "text-green-500" : "text-gray-500"}`}>
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                file ? "border-green-500 bg-green-100" : "border-gray-300"
              }`}
            >
              {file ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <span className="ml-2 font-medium">Upload</span>
          </div>
          <div className="h-1 w-12 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${summary ? "text-green-500" : "text-gray-500"}`}>
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                summary ? "border-green-500 bg-green-100" : "border-gray-300"
              }`}
            >
              {summary ? <Check className="h-5 w-5" /> : "2"}
            </div>
            <span className="ml-2 font-medium">Summarize</span>
          </div>
          <div className="h-1 w-12 mx-4 bg-gray-200"></div>
          <div className="flex items-center text-gray-500">
            <div className="rounded-full h-8 w-8 flex items-center justify-center border-2 border-gray-300">3</div>
            <span className="ml-2 font-medium">Read</span>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`max-w-md mx-auto mb-8 p-6 rounded-lg border-2 border-dashed ${
            file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"
          } transition-all`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!file ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex flex-col text-sm">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition inline-block mx-auto"
                >
                  Choose PDF
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    ref={fileInputRef}
                    className="sr-only"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-2 text-gray-500">or drag and drop</p>
                <p className="text-xs text-gray-500 mt-2">PDF up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-10 w-10 text-green-500 mr-3" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                aria-label="Remove file"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleSubmit}
            disabled={!file || isProcessing}
            className={`flex items-center justify-center py-2 px-6 rounded-md font-medium transition 
              ${!file || isProcessing ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Summarize PDF"
            )}
          </button>
          {file && (
            <button
              onClick={handleClear}
              className="py-2 px-6 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Summary Results */}
        {summary && (
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="prose max-w-none">
              <p>{summary}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition">
                Download Summary
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white flex items-center border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">&copy; 2025 Shortify. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
