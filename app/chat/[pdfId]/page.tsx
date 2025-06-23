'use client'

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Document, Page} from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from 'react-pdf';



// Dynamically resolve the worker file at runtime:
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;



interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatPage() {
  const { pdfId } = useParams();
  const [url, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchPdf() {
      if (!pdfId) {
        setError("No PDF ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/pdf/${pdfId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("PDF not found");
          }
          const errorText = await res.text();
          console.error("API error response:", errorText);
          throw new Error(`Server error: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data?.url) {
          throw new Error("PDF URL missing in response");
        }
        
        setPdfUrl(data.url);
      } catch (err) {
        console.error("Failed to fetch PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    }

    fetchPdf();
  }, [pdfId]);

  const handleSend = async () => {
    if (!query.trim() || isSending) return;

    const userMessage: ChatMessage = { role: "user", content: query };
    setChat((prev) => [...prev, userMessage]);
    setQuery("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, pdfId }),
      });

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.status}`);
      }

      const data = await res.json();
      const botMessage: ChatMessage = { 
        role: "bot", 
        content: data.response || "Sorry, I couldn't process your request." 
      };
      
      setChat((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "bot",
        content: "Sorry, there was an error processing your message. Please try again."
      };
      setChat((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      
  
      {/* PDF Viewer Section */}
      
      <div className="w-3/4 p-4 pt-20 overflow-y-auto bg-gray-50">
        {url ? (
          <>
            <Document
              file={url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => {
                console.error("PDF load error:", error);
                setError("Failed to load PDF document");
              }}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
            >
              <Page 
                pageNumber={currentPage} 
                width={800} 
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }
              />
            </Document>
            
            {/* Page Navigation */}
            <div className="flex justify-between items-center mt-4 bg-white p-3 rounded-lg shadow">
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="font-medium">
                Page {currentPage} of {numPages}
              </span>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage === numPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">PDF not available</p>
          </div>
        )}
      </div>

      {/* Chat Section */}
      <div className="w-1/4 border-l flex flex-col justify-between p-4 bg-white">
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {chat.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Ask questions about the PDF!</p>
            </div>
          ) : (
            chat.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-100 text-right ml-4"
                    : "bg-gray-200 text-left mr-4"
                }`}
              >
                <div className={`text-xs text-gray-600 mb-1 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}>
                  {msg.role === "user" ? "You" : "AI"}
                </div>
                <div className="text-sm">{msg.content}</div>
              </div>
            ))
          )}
          {isSending && (
            <div className="bg-gray-200 text-left mr-4 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">AI</div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask something about the PDF..."
            className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!query.trim() || isSending}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}