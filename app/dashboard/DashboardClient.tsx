"use client";

import { useState } from "react";
import { File, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore"; 
import { extractTextFromPDF } from "@/lib/pdfUtils";


interface DashboardClientProps {
  userId: string;
}

export default function DashboardClient({ userId = "demo-user" }: DashboardClientProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      background: ${type === 'success' ? 'linear-gradient(to right, #10b981, #059669)' : 'linear-gradient(to right, #ef4444, #dc2626)'};
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast("Please select a file first.", "error");
      return;
    }
  
    setIsUploading(true);
  
    try {
      // Step 1: Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "studyForge");
      formData.append("cloud_name", "dpv95vl8a");
  
      const uploadRes = await fetch("https://api.cloudinary.com/v1_1/dpv95vl8a/raw/upload", {
        method: "POST",
        body: formData,
      });
      const cloudinaryData = await uploadRes.json();
      const url = cloudinaryData.secure_url;
      const fileName = cloudinaryData.original_filename;
  
      // Step 2: Extract text
      const text = await extractTextFromPDF(selectedFile);
      console.log(text);
  
      // Step 3: Get embedding from Groq
      // Step 3: Get embedding using USE (512-d)
      
  
      // Step 4: Save everything to Firestore
      const docRef = await addDoc(collection(db, "uploads"), {
        url,
        fileName,
        userId,
        text: text.slice(0, 10000),
        
        createdAt: new Date().toISOString(),
      });
      
      showToast("Upload successful!", "success");
      router.push(`/chat/${docRef.id}`);  
    } catch (err) {
      console.error(err);
      showToast("Failed to upload or process the PDF.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div 
      className="justify-center flex w-full min-h-screen text-white p-6 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #312e81)' 
      }}
    >
      {/* Background blur effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-100px] left-[10%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-120px] right-[15%] w-[250px] h-[250px] bg-purple-400/10 blur-[80px] rounded-full"></div>
      </div>

      <div className="max-w-4xl h-[30vh] justify-center w-full mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 justify-center flex-col">
          <h1 className="text-4xl h-[20vh] font-bold text-white mb-2 flex items-center gap-3">
            📄 Upload Your PDF
          </h1>
          <p className="text-slate-300 text-lg">Select and upload your PDF documents for processing</p>
        </div>

        {/* Upload Section */}
        <div 
          className="rounded-xl p-8 mb-6"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(71, 85, 105, 0.5)'
          }}
        >
          {/* File Input Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-200 mb-3">
              Choose PDF File
            </label>
            
            <div className="relative">
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <label
                htmlFor="file-input"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200"
                style={{
                  borderColor: 'rgba(99, 102, 241, 0.5)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)';
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                }}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-slate-300" />
                  <p className="mb-2 text-sm text-slate-200">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">PDF files only</p>
                </div>
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div 
              className="mb-6 p-4 rounded-lg"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(71, 85, 105, 0.5)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-slate-300">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-red-600/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full h-[10vh] text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            style={{
              background: (!selectedFile || isUploading) 
                ? 'rgba(71, 85, 105, 0.5)' 
                : 'linear-gradient(to right, #6366f1, #8b5cf6)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              if (!(!selectedFile || isUploading)) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span 
                  className="px-4 py-1 rounded-md"
                  style={{
                    background: 'rgba(168, 85, 247, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(168, 85, 247, 0.5)'
                  }}
                >
                  Upload PDF
                </span>
              </>
            )}
          </button>
        </div>
        <div className="w-full h-[10vh]"></div>

        {/* PDF Preview */}
        {previewUrl && (
          <div 
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(71, 85, 105, 0.5)'
            }}
          >
            <div 
              className="px-6 py-4"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(71, 85, 105, 0.5)'
              }}
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <File className="w-5 h-5" />
                PDF Preview
              </h3>
            </div>
            <div className="p-6">
              <iframe
                src={previewUrl}
                title="PDF Preview"
                className="w-full h-96 rounded-lg bg-white"
                style={{
                  border: '1px solid rgba(71, 85, 105, 0.5)'
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}