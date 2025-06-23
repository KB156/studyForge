'use client';

import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-100 w-full px-6 h-[8vh] bg-slate-900/95 backdrop-blur-sm text-white flex items-center justify-between shadow-xl border-b border-slate-800">
      <div className="px-32">
      <h1 className="text-6xl  font-semibold tracking-wide text-indigo-400 drop-shadow-md">
        StudyForge
      </h1>
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}