'use client'

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const pdfId = params?.pdfId as string;
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
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #312e81)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#cbd5e1' }}>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #312e81)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #312e81)', position: 'relative', overflow: 'hidden' }}>
      {/* Background blur effects */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '10%', width: '300px', height: '300px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-120px', right: '15%', width: '250px', height: '250px', background: 'rgba(168, 85, 247, 0.1)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
      </div>

      {/* PDF Viewer Section */}
      <div style={{ width: 'calc(100% - 400px)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* PDF Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          {url ? (
            <Document
              file={url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => {
                console.error("PDF load error:", error);
                setError("Failed to load PDF document");
              }}
              loading={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                  <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              }
            >
              <Page 
                pageNumber={currentPage} 
                width={Math.min(800, window.innerWidth * 0.6)}
                loading={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid #6366f1', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                }
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: '#cbd5e1' }}>PDF not available</p>
            </div>
          )}
        </div>
        
        {/* Page Navigation */}
        <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(71, 85, 105, 0.5)', boxShadow: '0 -2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <button 
              style={{ 
                background: currentPage === 1 ? 'rgba(71, 85, 105, 0.5)' : 'linear-gradient(to right, #6366f1, #8b5cf6)', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#f1f5f9',
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(10px)',
              padding: '12px 20px',
              borderRadius: '8px',
              minWidth: '120px',
              textAlign: 'center',
              border: '1px solid rgba(71, 85, 105, 0.5)'
            }}>
              Page {currentPage} of {numPages}
            </span>
            <button
              style={{ 
                background: currentPage === numPages ? 'rgba(71, 85, 105, 0.5)' : 'linear-gradient(to right, #6366f1, #8b5cf6)', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: currentPage === numPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage === numPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', height: '100vh', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderLeft: '1px solid rgba(71, 85, 105, 0.5)', position: 'relative', zIndex: 1 }}>
        {/* Chat Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(71, 85, 105, 0.5)', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Chat with PDF</h3>
        </div>
        
        {/* Chat Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chat.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>💬</div>
                <p style={{ color: '#cbd5e1', fontSize: '16px' }}>Ask questions about the PDF!</p>
              </div>
            </div>
          ) : (
            <>
              {chat.map((msg, idx) => (
                <div
                  key={idx}
                  style={{ 
                    display: 'flex', 
                    justifyContent: msg.role === "user" ? 'flex-end' : 'flex-start' 
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: msg.role === "user" ? 'linear-gradient(to right, #6366f1, #8b5cf6)' : 'rgba(30, 41, 59, 0.6)',
                      backdropFilter: 'blur(10px)',
                      color: msg.role === "user" ? 'white' : '#f1f5f9',
                      border: msg.role === "bot" ? '1px solid rgba(71, 85, 105, 0.5)' : 'none'
                    }}
                  >
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      color: msg.role === "user" ? 'rgba(255,255,255,0.8)' : '#cbd5e1'
                    }}>
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '85%', 
                    background: 'rgba(30, 41, 59, 0.6)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(71, 85, 105, 0.5)', 
                    padding: '12px 16px', 
                    borderRadius: '12px' 
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>AI Assistant</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', background: '#cbd5e1', borderRadius: '50%', animation: 'bounce 1.4s infinite both' }}></div>
                      <div style={{ width: '8px', height: '8px', background: '#cbd5e1', borderRadius: '50%', animation: 'bounce 1.4s infinite both', animationDelay: '0.16s' }}></div>
                      <div style={{ width: '8px', height: '8px', background: '#cbd5e1', borderRadius: '50%', animation: 'bounce 1.4s infinite both', animationDelay: '0.32s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(71, 85, 105, 0.5)', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              style={{
                flex: 1,
                border: '2px solid rgba(71, 85, 105, 0.5)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#f1f5f9',
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(10px)',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(71, 85, 105, 0.5)'}
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || isSending}
              style={{
                background: (!query.trim() || isSending) ? 'rgba(71, 85, 105, 0.5)' : 'linear-gradient(to right, #6366f1, #8b5cf6)',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: (!query.trim() || isSending) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isSending ? (
                <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}