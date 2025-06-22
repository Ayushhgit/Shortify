import React, { useState, useRef } from "react";
import {
    Search, Home, User, Settings, Upload, Camera, FileText,
    Brain, Zap, Target, CheckCircle, AlertCircle, Download,
    Sparkles, BookOpen, PenTool, Eye, Edit3, MessageSquare,
    ArrowRight, RotateCcw, ImageIcon
} from "lucide-react";
import Toast from "../components/Toast";
import { getToken } from '../firebase';
import { useNavigate } from "react-router-dom";

const AssignmentHelper = () => {
    const [step, setStep] = useState(1);
    const [inputMethod, setInputMethod] = useState(null);
    const [textInput, setTextInput] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [imagePaths, setImagePaths] = useState([]);
    const [textToRender, setTextToRender] = useState("");
    const [aiResponseText, setAiResponseText] = useState("");
    const [showHandwritingOptions, setShowHandwritingOptions] = useState(false);
    const [handwritingConfig, setHandwritingConfig] = useState({
        paper_type: 'ruled',
        ink_color: 'blue',
        font_size: 'medium',
        font_style: 'QECarolineMutiboko',
        line_spacing: 1.3,
        margin: 100
    });
    const [renderedImage, setRenderedImage] = useState(null);
    const [isRendering, setIsRendering] = useState(false);
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);
    const [editedAnswer, setEditedAnswer] = useState("");
    const [allRenderedImages, setAllRenderedImages] = useState([]);
    const displayToast = (message, type = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };


    const navigate = useNavigate();

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const inputMethods = [
        {
            id: "text",
            name: "Type Your Question",
            icon: PenTool,
            color: "from-blue-500 to-indigo-600",
            description: "Paste or type your topic directly"
        },
        {
            id: "upload",
            name: "Upload Document",
            icon: Upload,
            color: "from-green-500 to-emerald-600",
            description: "Upload PDF, DOCX, or image files"
        },
        {
            id: "camera",
            name: "Take Photo",
            icon: Camera,
            color: "from-purple-500 to-pink-600",
            description: "upload the topic with your camera"
        }
    ];


    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'];

            if (validTypes.includes(file.type)) {
                setUploadedFile(file);
                setInputMethod(inputMethods.find(m => m.id === 'upload'));
                displayToast("File uploaded successfully!");
            } else {
                displayToast("Please upload a valid file type (PDF, DOCX, or image)", "error");
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
            displayToast("File uploaded successfully!");
        }
    };

    const handleCameraCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target.result);
                displayToast("Photo captured successfully!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        const idToken = await getToken();
        if (!idToken) {
            console.error("User not authenticated");
            displayToast("Authentication failed. Please try logging in again.", "error");
            return;
        }

        if (!inputMethod) {
            displayToast("Please select an input method", "error");
            return;
        }

        if (inputMethod.id === 'text' && !textInput.trim()) {
            displayToast("Please enter your question", "error");
            return;
        }

        if (inputMethod.id === 'upload' && !uploadedFile) {
            displayToast("Please upload a file", "error");
            return;
        }

        if (inputMethod.id === 'camera' && !capturedImage) {
            displayToast("Please capture an image", "error");
            return;
        }

        setLoading(true);
        setStep(3);

        try {
            let response;
            let data;

            if (inputMethod.id === 'text') {
                // Use the fixed endpoint structure
                const requestBody = {
                    questions: [textInput.trim()], // Ensure it's an array with trimmed text
                    subject: "general"
                };

                console.log('Sending request body:', requestBody); // Debug log

                response = await fetch('http://localhost:8000/ai/generate-solutions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error:', errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                data = await response.json();
                console.log('Received data:', data); // Debug log

            } else if (inputMethod.id === 'upload' || inputMethod.id === 'camera') {
                const formData = new FormData();

                if (inputMethod.id === 'upload') {
                    formData.append('file', uploadedFile);
                } else if (inputMethod.id === 'camera') {
                    // Convert capturedImage (base64) to Blob
                    try {
                        const blob = await (await fetch(capturedImage)).blob();
                        formData.append('file', blob, 'captured_image.png');
                    } catch (blobError) {
                        console.error('Error converting captured image:', blobError);
                        throw new Error('Failed to process captured image');
                    }
                }

                formData.append('subject', 'general');

                console.log('Uploading file...'); // Debug log

                response = await fetch('http://localhost:8000/ai/upload-and-solve', {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${idToken}`,
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('File upload error:', errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                data = await response.json();
                console.log('File processing result:', data); // Debug log
            }

            // Check if we have valid data
            if (!data || !data.solutions || data.solutions.length === 0) {
                throw new Error('No solutions received from server');
            }

            const solution = data.solutions[0];

            // Transform the data to match your expected result format
            const transformedResult = {
                question: solution.question || inputMethod.id === 'text' ? textInput : `Content from ${uploadedFile?.name || 'captured image'}`,
                answer: solution.answer || "No response generated",
                confidence: solution.confidence || 85,
                steps: solution.steps?.length > 0 ? solution.steps :
                    solution.answer ? solution.answer.split('\n').filter(line => line.trim().length > 20).slice(0, 5).map((line, i) => `${i + 1}. ${line.trim()}`) :
                        ["Processing completed", "Response generated"],
                keyPoints: solution.key_points?.length > 0 ? solution.key_points :
                    extractKeyPoints(solution.answer || solution.explanation || ""),
                explanation: solution.explanation || solution.answer || "Detailed solution provided above",
                metadata: solution.metadata || {}
            };

            setAiResponseText(transformedResult.answer || transformedResult.explanation || "No response text available");

            console.log('Transformed result:', transformedResult); // Debug log

            setResult(transformedResult);
            setLoading(false);
            setStep(4);

        } catch (error) {
            console.error('Error in handleSubmit:', error);

            // More specific error messages
            let errorMessage = "Failed to process assignment. Please try again.";

            if (error.message.includes('422')) {
                errorMessage = "Invalid request format. Please check your input.";
            } else if (error.message.includes('500')) {
                errorMessage = "Server error. Please try again later.";
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = "Cannot connect to server. Please check if the server is running.";
            }

            displayToast(errorMessage, "error");
            setLoading(false);
            setStep(2);
        }
    };

    const renderHandwritingImage = async () => {
        try {
            if (!result || !result.answer) {
                displayToast("Please solve the assignment first!", "error");
                return;
            }

            setIsRendering(true);
            // Use the current answer (which might be edited)
            const textToRender = result.answer + "\n\n" + (result.explanation || "");

            console.log("Sending text to handwriting:", textToRender);

            const response = await fetch('http://localhost:8000/render/handwriting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: textToRender,
                    ...handwritingConfig
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Handle both single and multiple pages
                let imageFilenames = [];

                if (data.image_paths && Array.isArray(data.image_paths)) {
                    // Multiple pages
                    imageFilenames = data.image_paths.map(path => path.split('/').pop());

                    // Display the first page immediately
                    const firstImageUrl = `http://localhost:8000/outputs/${imageFilenames[0]}`;
                    setRenderedImage(firstImageUrl);

                    displayToast(`Handwriting rendered successfully! ${data.total_pages} pages created.`);
                } else {
                    // Single page (backward compatibility)
                    const filename = data.image_path.split('/').pop();
                    imageFilenames = [filename];

                    const imageUrl = `http://localhost:8000/outputs/${filename}`;
                    setRenderedImage(imageUrl);

                    displayToast("Handwriting image rendered successfully!");
                }

                // Update image paths for PDF generation
                setImagePaths(imageFilenames);

            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Handwriting rendering failed");
            }
        } catch (error) {
            console.error(error);
            displayToast(`Handwriting rendering failed: ${error.message}`, "error");
        } finally {
            setIsRendering(false);
        };
    };

    // 3. Fix: Update generatePDF function
    const generatePDF = async () => {
        try {
            // Check if we have images to export
            if (imagePaths.length === 0) {
                displayToast("Please render handwriting images first!", "error");
                return;
            }

            console.log("Generating PDF with images:", imagePaths);

            const response = await fetch('http://localhost:8000/export/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_paths: imagePaths  // This should now have images
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const pdfFilename = data.pdf_path.split('/').pop();

                const pdfResponse = await fetch(`http://localhost:8000/outputs/${pdfFilename}`);
                if (!pdfResponse.ok) {
                    throw new Error('Failed to fetch the generated PDF');
                }

                const blob = await pdfResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'assignment_solution.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                displayToast("PDF downloaded successfully!");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'PDF generation failed');
            }
        } catch (error) {
            console.error("PDF generation error:", error);
            displayToast(`PDF generation failed: ${error.message}`, "error");
        }
    };

    const reset = () => {
        setStep(1);
        setInputMethod(null);
        setTextInput("");
        setUploadedFile(null);
        setCapturedImage(null);
        setResult(null);
        setRenderedImage(null);
        setImagePaths([]);
        setAllRenderedImages([]); // Clear all rendered images
        setIsEditingAnswer(false); // Reset edit state
        setEditedAnswer(""); // Clear edited answer
        setAiResponseText(""); // Clear AI response text
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-10 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                </div>
            </div>

            {/* Header */}
            <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
                <div className="flex justify-between items-center h-16 px-6">
                    <div className="flex items-center">
                        <div className="relative">
                            <Brain className="h-8 w-8 text-purple-400 mr-3" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-xl font-bold text-white">
                            Notes<span className="text-purple-400">AI</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {[{ icon: Home, path: "/shortify" }, { icon: User, path: "/profile" }, { icon: Settings, path: "/settings" }].map(
                            (item, index) => (
                                <button
                                    key={index}
                                    className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                                    onClick={() => navigate(item.path)}>
                                    <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-32 pb-16 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-6">
                            <Brain className="w-4 h-4 mr-2" />
                            AI-Powered Notes generator
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                            Notes AI
                            <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                                Get Instant Notes
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Upload documents, take photos, or type topics directly. Get comprehensive results with step-by-step explanations powered by advanced AI.
                        </p>
                    </div>

                    {/* Step 1: Input Method Selection */}
                    {step === 1 && (
                        <div className="max-w-4xl mx-auto space-y-12">
                            <div className="space-y-8">
                                <div className="flex items-center justify-center space-x-3 mb-8">
                                    <Target className="w-6 h-6 text-emerald-400" />
                                    <h2 className="text-2xl font-bold text-white">
                                        Choose Your Input Method
                                    </h2>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {inputMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                setInputMethod(method);
                                                setStep(2);
                                            }}
                                            className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${inputMethod?.id === method.id
                                                ? 'border-emerald-400 bg-emerald-500/20'
                                                : 'border-white/30 bg-white/10 hover:border-emerald-400/50'
                                                }`}
                                        >
                                            <div className="text-center space-y-4">
                                                <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                                                    <method.icon className="w-8 h-8 text-white" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-white">{method.name}</h3>
                                                <p className="text-gray-300 text-sm">{method.description}</p>
                                            </div>
                                            {inputMethod?.id === method.id && (
                                                <div className="absolute top-4 right-4">
                                                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Input Content */}
                    {step === 2 && inputMethod && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white mb-4">
                                    {inputMethod.name}
                                </h2>
                                <p className="text-gray-300">{inputMethod.description}</p>
                            </div>

                            {/* Text Input */}
                            {inputMethod.id === 'text' && (
                                <div className="space-y-6">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                                        <textarea
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder="Type or paste your assignment question here..."
                                            className="w-full h-64 bg-transparent border-none resize-none text-white placeholder-gray-400 focus:outline-none text-lg"
                                        />
                                    </div>
                                    {textInput.trim() && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleSubmit}
                                                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Zap className="w-5 h-5" />
                                                    <span>Get Solution</span>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* File Upload */}
                            {inputMethod.id === 'upload' && (
                                <div className="space-y-6">
                                    <div
                                        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${dragActive
                                            ? "border-emerald-400 bg-emerald-500/20"
                                            : uploadedFile
                                                ? "border-green-400 bg-green-500/20"
                                                : "border-white/30 bg-white/10 hover:border-emerald-400/50"
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.docx,.jpg,.jpeg,.png,.gif"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="space-y-4">
                                            {uploadedFile ? (
                                                <>
                                                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                                                    <div>
                                                        <p className="text-green-300 font-semibold text-lg">
                                                            File uploaded successfully!
                                                        </p>
                                                        <p className="text-gray-300">{uploadedFile.name}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-16 h-16 text-white/60 mx-auto" />
                                                    <div>
                                                        <p className="text-white font-semibold text-lg">
                                                            Drop your files here
                                                        </p>
                                                        <p className="text-gray-300">
                                                            PDF, DOCX, or image files supported
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {uploadedFile && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleSubmit}
                                                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Zap className="w-5 h-5" />
                                                    <span>Analyze Document</span>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Camera Capture */}
                            {inputMethod.id === 'camera' && (
                                <div className="space-y-6">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
                                        {capturedImage ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={capturedImage}
                                                    alt="Captured"
                                                    className="max-w-full max-h-64 mx-auto rounded-2xl"
                                                />
                                                <p className="text-green-300 font-semibold">
                                                    Photo captured successfully!
                                                </p>
                                                <button
                                                    onClick={() => cameraInputRef.current?.click()}
                                                    className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all duration-300"
                                                >
                                                    Take Another Photo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <Camera className="w-16 h-16 text-white/60 mx-auto" />
                                                <div>
                                                    <p className="text-white font-semibold text-lg mb-4">
                                                        Capture Assignment Question
                                                    </p>
                                                    <button
                                                        onClick={() => cameraInputRef.current?.click()}
                                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <Camera className="w-5 h-5" />
                                                            <span>Take Photo</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleCameraCapture}
                                            className="hidden"
                                        />
                                    </div>
                                    {capturedImage && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleSubmit}
                                                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Zap className="w-5 h-5" />
                                                    <span>Analyze Image</span>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Back Button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300"
                                >
                                    ← Back to Input Methods
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Loading */}
                    {step === 3 && loading && (
                        <div className="max-w-2xl mx-auto text-center space-y-8">
                            <div className="space-y-6">
                                <Brain className="w-20 h-20 text-emerald-400 mx-auto animate-pulse" />
                                <h2 className="text-3xl font-bold text-white">
                                    Analyzing Your Assignment
                                </h2>
                                <p className="text-gray-300 text-lg">
                                    Our AI is processing your question and generating a comprehensive solution...
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="space-y-4">
                                    {[
                                        "Processing your input...",
                                        "Understanding the context...",
                                        "Researching relevant information...",
                                        "Generating step-by-step solution...",
                                        "Preparing detailed explanation..."
                                    ].map((text, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div
                                                className={`w-4 h-4 rounded-full ${index < 3
                                                    ? "bg-emerald-400"
                                                    : index === 3
                                                        ? "bg-emerald-400 animate-pulse"
                                                        : "bg-gray-600"
                                                    }`}
                                            ></div>
                                            <span className="text-gray-300">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {step === 4 && result && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-bold text-white">
                                    Solution Ready
                                </h2>
                                <div className="inline-flex items-center px-6 py-3 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-semibold">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {result.confidence}% Confidence
                                </div>
                            </div>

                            {/* Question */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/30">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <MessageSquare className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Question</h3>
                                </div>
                                <p className="text-gray-300 text-lg">{result.question}</p>
                            </div>

                            {/* Answer */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-green-400/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-green-500/20 rounded-xl">
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Answer</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isEditingAnswer) {
                                                // Save the edited answer
                                                setResult(prev => ({
                                                    ...prev,
                                                    answer: editedAnswer,
                                                    explanation: editedAnswer // Update explanation too
                                                }));
                                                setAiResponseText(editedAnswer);
                                                setIsEditingAnswer(false);
                                            } else {
                                                // Start editing
                                                setEditedAnswer(result.answer);
                                                setIsEditingAnswer(true);
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all duration-300 flex items-center space-x-2"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span>{isEditingAnswer ? 'Save' : 'Edit'}</span>
                                    </button>
                                </div>

                                {isEditingAnswer ? (
                                    <div className="space-y-4">
                                        <textarea
                                            value={editedAnswer}
                                            onChange={(e) => setEditedAnswer(e.target.value)}
                                            className="w-full h-64 bg-white/5 border border-white/20 rounded-xl p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-400 resize-none"
                                            placeholder="Edit your answer here..."
                                        />
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => {
                                                    setResult(prev => ({
                                                        ...prev,
                                                        answer: editedAnswer,
                                                        explanation: editedAnswer
                                                    }));
                                                    setAiResponseText(editedAnswer);
                                                    setIsEditingAnswer(false);
                                                }}
                                                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all duration-300"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditedAnswer(result.answer);
                                                    setIsEditingAnswer(false);
                                                }}
                                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{result.answer}</p>
                                )}
                            </div>

                            {/* Steps */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/30">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Step-by-Step Solution</h3>
                                </div>
                                <div className="space-y-4">
                                    {result.steps && result.steps.length > 0 ? (
                                        result.steps.map((step, index) => (
                                            <div key={index} className="flex items-start space-x-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                                    <span className="text-purple-300 font-semibold">{index + 1}</span>
                                                </div>
                                                <p className="text-gray-300 flex-1">{step}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">Step-by-step breakdown is included in the answer above.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Key Points */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-orange-400/30">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-3 bg-orange-500/20 rounded-xl">
                                        <Target className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Key Points</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {result.keyPoints.map((point, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                            <span className="text-gray-300">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="p-3 bg-gray-500/20 rounded-xl">
                                        <Eye className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Detailed Explanation</h3>
                                </div>
                                <p className="text-gray-300 text-lg leading-relaxed">{result.explanation}</p>
                            </div>

                            {/* Updated Action Buttons */}
                            <div className="flex flex-col items-center space-y-4">
                                {/* First row - Render handwriting */}


                                {/* Second row - Export options (show only if images are rendered) */}
                                {imagePaths.length > 0 && (
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            onClick={generatePDF}
                                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Download className="w-5 h-5" />
                                                <span>Download PDF ({imagePaths.length} pages)</span>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Third row - Reset */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={reset}
                                        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RotateCcw className="w-5 h-5" />
                                            <span>New Question</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Handwriting Configuration Panel */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-purple-500/20 rounded-xl">
                                            <Edit3 className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Handwriting Options</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowHandwritingOptions(!showHandwritingOptions)}
                                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300"
                                    >
                                        {showHandwritingOptions ? 'Hide Options' : 'Show Options'}
                                    </button>
                                </div>

                                {showHandwritingOptions && (
                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        {/* Paper Type */}
                                        <div className="space-y-2">
                                            <label className="text-white font-semibold">Paper Type</label>
                                            <select
                                                value={handwritingConfig.paper_type}
                                                onChange={(e) => setHandwritingConfig({ ...handwritingConfig, paper_type: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                                            >
                                                <option value="ruled" className="bg-gray-800">Ruled Paper</option>
                                                <option value="plain" className="bg-gray-800">Plain Paper</option>
                                            </select>
                                        </div>

                                        {/* Ink Color */}
                                        <div className="space-y-2">
                                            <label className="text-white font-semibold">Ink Color</label>
                                            <select
                                                value={handwritingConfig.ink_color}
                                                onChange={(e) => setHandwritingConfig({ ...handwritingConfig, ink_color: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                                            >
                                                <option value="blue" className="bg-gray-800">Blue</option>
                                                <option value="black" className="bg-gray-800">Black</option>
                                                <option value="red" className="bg-gray-800">Red</option>
                                                <option value="green" className="bg-gray-800">Green</option>
                                            </select>
                                        </div>

                                        {/* Font Size */}
                                        <div className="space-y-2">
                                            <label className="text-white font-semibold">Font Size</label>
                                            <select
                                                value={handwritingConfig.font_size}
                                                onChange={(e) => setHandwritingConfig({ ...handwritingConfig, font_size: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                                            >
                                                <option value="small" className="bg-gray-800">Small</option>
                                                <option value="medium" className="bg-gray-800">Medium</option>
                                                <option value="large" className="bg-gray-800">Large</option>
                                                <option value="xlarge" className="bg-gray-800">Extra Large</option>
                                            </select>
                                        </div>

                                        {/* Font Style */}
                                        <div className="space-y-2">
                                            <label className="text-white font-semibold">Font Style</label>
                                            <select
                                                value={handwritingConfig.font_style}
                                                onChange={(e) => setHandwritingConfig({ ...handwritingConfig, font_style: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                                            >
                                                <option value="QECarolineMutiboko" className="bg-gray-800">Caroline</option>
                                                <option value="kalam-Regular" className="bg-gray-800">Kalam</option>
                                                <option value="QEDaveMergens" className="bg-gray-800">QEDaveMergens</option>
                                                <option value="QEGarrettWMoretz" className="bg-gray-800">QEGarrettWMoretz</option>
                                                <option value="QEGHHughes" className="bg-gray-800">QEGHHughes</option>
                                                <option value="QEHerbertCooper" className="bg-gray-800">QEHerbertCooper</option>
                                                <option value="QERuthStafford" className="bg-gray-800">QERuthStafford</option>
                                            </select>
                                        </div>

                                        {/* Line Spacing */}
                                        <div className="space-y-2">
                                            <label className="text-white font-semibold">Line Spacing: {handwritingConfig.line_spacing}</label>
                                            <input
                                                type="range"
                                                min="1.0"
                                                max="2.5"
                                                step="0.1"
                                                value={handwritingConfig.line_spacing}
                                                onChange={(e) => setHandwritingConfig({ ...handwritingConfig, line_spacing: parseFloat(e.target.value) })}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>

                                        {/* Margin */}
                                        <div className="space-y-2">
                                            <label className="text-white font-semibold">Margin: {handwritingConfig.margin}px</label>
                                            <input
                                                type="range"
                                                min="50"
                                                max="200"
                                                step="10"
                                                value={handwritingConfig.margin}
                                                onChange={(e) => setHandwritingConfig({ ...handwritingConfig, margin: parseInt(e.target.value) })}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Render Button */}
                                <div className="flex justify-center mb-6">
                                    <button
                                        onClick={renderHandwritingImage}
                                        disabled={!result || isRendering}
                                        className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${result && !isRendering
                                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {isRendering ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Edit3 className="w-5 h-5" />
                                            )}
                                            <span>{isRendering ? 'Rendering...' : 'Render Handwriting'}</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Rendered Image Display */}
                                {renderedImage && (
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-bold text-white text-center">
                                            Rendered Handwriting {imagePaths.length > 1 ? `(${imagePaths.length} pages)` : ''}
                                        </h4>

                                        {/* Show all pages if multiple */}
                                        {imagePaths.length > 1 ? (
                                            <div className="space-y-4">
                                                {imagePaths.map((filename, index) => (
                                                    <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                        <h5 className="text-lg font-semibold text-white mb-2 text-center">
                                                            Page {index + 1}
                                                        </h5>
                                                        <img
                                                            src={`http://localhost:8000/outputs/${filename}`}
                                                            alt={`Rendered Handwriting Page ${index + 1}`}
                                                            className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl"
                                                            style={{ maxHeight: '800px', objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                <img
                                                    src={renderedImage}
                                                    alt="Rendered Handwriting"
                                                    className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl"
                                                    style={{ maxHeight: '800px', objectFit: 'contain' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
                    <p className="text-gray-300 text-center">
                        Made with ❤️ and ☕ | Powered by AI
                    </p>
                </div>
            </footer>


            {/* Toast */}
            <Toast
                show={showToast}
                message={toastMessage}
                type={toastType}
                onClose={() => setShowToast(false)}
            />

            <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default AssignmentHelper;