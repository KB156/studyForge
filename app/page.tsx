"use client";


import React from "react";
import { useUser, SignUpButton } from "@clerk/nextjs";

export default function Page() {
  const { isSignedIn, user } = useUser();

  React.useEffect(() => {
    const ripple = document.getElementById("cursor-ripple");

    const handleMouseMove = (e: MouseEvent) => {
      if (ripple) {
        ripple.style.left = `${e.clientX - 96}px`;
        ripple.style.top = `${e.clientY - 96}px`;
        ripple.style.opacity = "1";
        ripple.style.transform = "scale(2)";
        clearTimeout((ripple as any)._rippleTimeout);
        (ripple as any)._rippleTimeout = setTimeout(() => {
          ripple.style.opacity = "0";
          ripple.style.transform = "scale(0)";
        }, 800);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="relative w-full flex-grow items-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 min-h-screen flex flex-col text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-100px] left-[10%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-120px] right-[15%] w-[250px] h-[250px] bg-purple-400/10 blur-[80px] rounded-full"></div>
      </div>

      <div
        id="cursor-ripple"
        className="pointer-events-none fixed z-30 w-48 h-48 bg-white/30 rounded-full scale-0 opacity-0 transition-transform duration-700 ease-out blur-3xl"
      />

          {!isSignedIn ? (
            <section className=" h-[50vh] w-full mt-32 p-12 rounded-xl  text-center space-y-8">
            <div className='h-[12vh]'></div>
            <h3 className=" h-[15vh] text-4xl font-bold">
              Ready to forge your path to academic success?
            </h3>
            <p className=" h-[10vh] text-xl text-gray-300">
              Join thousands of students who've already transformed their study habits with StudyForge.
            </p>
            <SignUpButton mode="modal">
                <button 
                  className="w-52 h-12 bg-gradient-to-r from-emerald-500 to-indigo-500 font-semibold text-xl text-white shadow-lg hover:scale-105 transition-transform duration-300 border-0 outline-none"
                  style={{ borderRadius: '9999px' }}
                >
                  Start Your Journey
                </button>
            </SignUpButton>
          </section>

          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="h-[25vh] flex items-center justify-center space-x-3 mb-8">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-2xl font-medium text-emerald-400">
                  Welcome back, {user?.firstName || "Student"}!
                </p>
              </div>
              <p className="text-lg  text-gray-400 mb-12 mt-32">
                Your dashboard is ready 
              </p>
              <p className="text-lg h-[5vh] text-gray-400 mb-12 mt-32">
                for your next study session 
              </p>
              <div className='h-[20vh]'>
              <a
                href="/dashboard"
                className=" flex items-center justify-center  px-16 w-72 h-16  bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-xl font-semibold shadow-lg hover:scale-105 transition-transform duration-300 text-center"
              >
                Go to Dashboard 
              </a>
              </div>
            </div>
          )}

      
       

        {/* Features Section */}
        

          <div className=" h-[10vh] py-7 px-42  grid grid-cols-2 gap-4 ">
            {[
              {
                icon: "📄",
                title: "Smart Upload",
                description:
                  "Drop your PDFs and study materials - our AI instantly processes and understands your content",
              },
              {
                icon: "✨",
                title: "AI Summaries",
                description:
                  "Get concise, intelligent summaries and auto-generated flashcards from your materials",
              },
              {
                icon: "❓",
                title: "Custom Quizzes",
                description:
                  "Practice with personalized quizzes that adapt to your learning style and progress",
              },
              {
                icon: "📚",
                title: "Smart Organization",
                description:
                  "Keep your content organized with intelligent tagging and easy retrieval",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-indigo-400/50 transition-transform duration-300 hover:scale-105"
              >
                <div className="text-center space-y-5">
                  <div className="text-3xl">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold">{feature.title}</h3>
                  <p className="text-lg text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        

        {/* Final CTA */}

      
    </main>
  );
}