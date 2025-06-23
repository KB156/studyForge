"use client";

import { useState } from "react";
import { File, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
      background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
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

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", "studyForge");
    formData.append("cloud_name", "dpv95vl8a");
    formData.append("resource_type", "raw");

    try {
      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dpv95vl8a/raw/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const secureUrl = cloudinaryData.secure_url;
      const filename = cloudinaryData.original_filename || selectedFile.name;

      // Save metadata to Firebase
      const metadataResponse = await fetch("/api/saveMetadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: secureUrl,
          fileName: filename,
          userId,
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error("Failed to save metadata");
      }

      const metadataData = await metadataResponse.json();
      
      if (!metadataData.success || !metadataData.documentId) {
        throw new Error("Invalid metadata response");
      }
      await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfId: metadataData.documentId,
        }),
      });

      showToast("Upload successful!", "success");
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Navigate using the document ID instead of filename
      router.push(`/chat/${metadataData.documentId}`);

    } catch (error) {
      showToast("Upload failed! Please try again.", "error");
      console.error("Upload error:", error);
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
    <div className="justify-center flex w-full min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl h-[30vh] justify-center w-full mx-auto">
        {/* Header */}
        <div className="mb-8 justify-center flex-col">
          <h1 className="text-4xl h-[20vh] font-bold text-white mb-2 flex items-center gap-3">
            📄 Upload Your PDF
          </h1>
          <p className="text-slate-400 text-lg">Select and upload your PDF documents for processing</p>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 mb-6">
          {/* File Input Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
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
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-slate-400" />
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">PDF files only</p>
                </div>
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="mb-6 p-4 bg-slate-700 border border-slate-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-slate-400">
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
            className="w-full h-[10vh] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="bg-indigo-400 px-4 py-1 rounded-md">
                  Upload PDF
                </span>
              </>
            )}
          </button>
        </div>
        <div className="w-full h-[10vh]"></div>

        {/* PDF Preview */}
        {previewUrl && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <File className="w-5 h-5" />
                PDF Preview
              </h3>
            </div>
            <div className="p-6">
              <iframe
                src={previewUrl}
                title="PDF Preview"
                className="w-full h-96 border border-slate-600 rounded-lg bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}