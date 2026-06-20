"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Mail, Phone, User, Calendar, IdCard, 
  Building, Share2, Link2, Eye, ShieldAlert, Award,
  Check, Lock, Sparkles, LogIn, Users, Info
} from "lucide-react";
import { api } from "@/lib/api";
import { CyberKavachLogo } from "@/components/CyberKavachLogo";

// Icon components for brands
const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: "1em", height: "1em" }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [member, setMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api<any>("/settings/landing-team");
        if (res.team) {
          const found = res.team.find((m: any) => m.id === id);
          if (found) setMember(found);
        }
      } catch (err) {
        console.error("Failed to load member profiles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  const handleShare = () => {
    const profileUrl = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(profileUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSaveLink = () => {
    const profileUrl = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#CCFF00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 font-mono">
        <ShieldAlert className="w-12 h-12 text-[#FF003C] animate-bounce" />
        <h2 className="text-lg uppercase tracking-widest text-[#FF003C]">Member Clearance Profile Not Found</h2>
        <Link href="/team" className="ck-btn-secondary text-xs uppercase flex items-center gap-1.5 mt-2">
          <ArrowLeft className="w-4 h-4" /> Back to Team
        </Link>
      </div>
    );
  }

  // Split about text by line to create skills list
  const skillLines = member.about ? member.about.split("\n").filter((l: string) => l.trim().length > 0) : [];

  return (
    <div className="min-h-screen bg-black text-white font-sans relative selection:bg-red-500/30">
      
      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/team" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <CyberKavachLogo animateDrawing={false} />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider">
          <Link href="/" className="text-zinc-400 hover:text-white transition">Home</Link>
          <Link href="/team" className="text-[#CCFF00] font-bold">Team</Link>
          <Link href="/events" className="text-zinc-400 hover:text-white transition">Events</Link>
          <Link href="/auth" className="text-zinc-400 hover:text-white transition">Register</Link>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-6">
        
        {/* Back Link subheader */}
        <div className="flex items-center">
          <Link href="/team" className="text-xs font-mono uppercase tracking-wider text-[#FF003C] hover:text-white flex items-center gap-1">
            &lt;- Back to Team
          </Link>
        </div>

        {/* Hero Card Container */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-md overflow-hidden relative shadow-2xl">
          
          {/* Cover Poster Banner */}
          <div className="h-44 w-full bg-zinc-900 overflow-hidden relative border-b border-zinc-800">
            {member.coverPosterUrl ? (
              <img src={member.coverPosterUrl} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 opacity-80 relative flex items-center justify-center">
                {/* Tech digital network matrix effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
              </div>
            )}
          </div>

          {/* Profile Header Overlay Area */}
          <div className="p-6 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12 z-10">
            {/* Avatar circle */}
            <div className="w-28 h-28 rounded-full border-4 border-zinc-950 bg-zinc-900 overflow-hidden shadow-2xl relative shrink-0">
              {member.imageUrl ? (
                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-650">
                  <Users className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Title / details */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1">{member.name}</h1>
              <p className="text-sm font-mono text-[#FF003C] tracking-wide font-semibold">{member.designation}</p>
              {member.department && (
                <p className="text-xs text-zinc-400 mt-1 uppercase font-mono">{member.department}</p>
              )}

              {/* Action Buttons: Send Mail & Call */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4">
                {member.email && (
                  <a 
                    href={`mailto:${member.email.trim()}`} 
                    className="px-3.5 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-600 border border-red-900/40 hover:border-red-500 text-xs font-mono uppercase tracking-wider text-red-200 hover:text-white flex items-center gap-1.5 transition duration-300"
                  >
                    <Mail className="w-3.5 h-3.5" /> Send Email
                  </a>
                )}
                {member.phone && (
                  <a 
                    href={`tel:${member.phone.trim()}`} 
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white flex items-center gap-1.5 transition duration-300"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic 2-Column Main Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Column: About & Skills Card */}
          <div className="md:col-span-3 space-y-6">
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FF003C]/40" />
              
              <h3 className="text-sm font-bold font-mono tracking-widest text-[#FF003C] uppercase flex items-center gap-2 mb-6">
                // About
              </h3>

              {skillLines.length === 0 ? (
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">{member.about || "No additional info available."}</p>
              ) : (
                <div className="space-y-4">
                  {skillLines.map((line: string, index: number) => {
                    // Split the colon to bold the label
                    const colonIdx = line.indexOf(":");
                    if (colonIdx !== -1) {
                      const boldPart = line.substring(0, colonIdx + 1);
                      const normPart = line.substring(colonIdx + 1);
                      return (
                        <div key={index} className="text-sm font-sans leading-relaxed text-zinc-300 flex items-start gap-2.5">
                          <span className="text-[#FF003C] font-mono select-none mt-0.5 shrink-0">//</span>
                          <span>
                            <strong className="text-white font-mono tracking-tight font-semibold">{boldPart}</strong>
                            {normPart}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={index} className="text-sm font-sans leading-relaxed text-zinc-300 flex items-start gap-2.5">
                        <span className="text-[#FF003C] font-mono select-none mt-0.5 shrink-0">//</span>
                        <span>{line}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column Stack */}
          <div className="md:col-span-2 space-y-6">
            
            {/* 1. Member Info Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 shadow-xl relative">
              <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-4">
                // Member Info
              </h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3 text-zinc-350">
                  <User className="w-4 h-4 text-[#FF003C]" />
                  <div>
                    <p className="text-[9px] uppercase text-zinc-500">Division</p>
                    <p className="text-white uppercase font-bold">{member.role.replace("_", " ")}</p>
                  </div>
                </div>
                {member.department && (
                  <div className="flex items-center gap-3 text-zinc-350">
                    <Building className="w-4 h-4 text-[#FF003C]" />
                    <div>
                      <p className="text-[9px] uppercase text-zinc-500">Department</p>
                      <p className="text-white uppercase">{member.department}</p>
                    </div>
                  </div>
                )}
                {member.joinedDate && (
                  <div className="flex items-center gap-3 text-zinc-350">
                    <Calendar className="w-4 h-4 text-[#FF003C]" />
                    <div>
                      <p className="text-[9px] uppercase text-zinc-500">Joined Crew</p>
                      <p className="text-white">{member.joinedDate}</p>
                    </div>
                  </div>
                )}
                {member.studentId && (
                  <div className="flex items-center gap-3 text-zinc-350">
                    <IdCard className="w-4 h-4 text-[#FF003C]" />
                    <div>
                      <p className="text-[9px] uppercase text-zinc-500">Access ID</p>
                      <p className="text-white">{member.studentId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Contact Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 shadow-xl relative">
              <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-4">
                // Contact
              </h3>
              
              <div className="space-y-3 font-mono text-xs">
                {member.email && (
                  <div className="flex items-center gap-3 text-zinc-350 truncate">
                    <Mail className="w-4 h-4 text-[#FF003C]" />
                    <div>
                      <p className="text-[9px] uppercase text-zinc-500">Email Address</p>
                      <a href={`mailto:${member.email.trim()}`} className="text-white hover:text-[#FF003C] transition break-all">{member.email}</a>
                    </div>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 text-zinc-350">
                    <Phone className="w-4 h-4 text-[#FF003C]" />
                    <div>
                      <p className="text-[9px] uppercase text-zinc-500">Secure Line</p>
                      <a href={`tel:${member.phone.trim()}`} className="text-white hover:text-[#FF003C] transition">{member.phone}</a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Social Media Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 shadow-xl relative">
              <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-4">
                // Social Media
              </h3>
              
              <div className="flex flex-col gap-2">
                {member.linkedin && (
                  <a 
                    href={`https://linkedin.com/in/${member.linkedin.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded bg-blue-950/20 hover:bg-blue-600 border border-blue-900/40 hover:border-blue-500 text-xs font-mono text-blue-200 hover:text-white transition duration-300"
                  >
                    <LinkedinIcon className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {member.github && (
                  <a 
                    href={`https://github.com/${member.github.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition duration-300"
                  >
                    <GithubIcon className="w-4 h-4" /> GitHub
                  </a>
                )}
                {member.instagram && (
                  <a 
                    href={`https://instagram.com/${member.instagram.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded bg-pink-950/20 hover:bg-pink-600 border border-pink-900/40 hover:border-pink-500 text-xs font-mono text-pink-200 hover:text-white transition duration-300"
                  >
                    <InstagramIcon className="w-4 h-4" /> Instagram
                  </a>
                )}
              </div>
            </div>

            {/* 4. Cyber Persona Card (Premium Purple Box) */}
            {(member.cyberName || member.cyberBackstory) && (
              <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/15 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between" style={{ minHeight: "260px" }}>
                {/* Cyber grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(129,140,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(129,140,248,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-400 uppercase flex items-center gap-1.5 mb-4 relative z-10">
                    // Cyber Persona
                  </h3>

                  {/* Character Avatar + Name */}
                  <div className="flex items-center gap-3.5 mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-lg border border-indigo-500/30 bg-indigo-950/60 overflow-hidden shrink-0 flex items-center justify-center">
                      {member.cyberAvatarUrl ? (
                        <img src={member.cyberAvatarUrl} alt="Cyber Character" className="w-full h-full object-cover animate-pulse" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-mono uppercase text-indigo-500">Character Codename</p>
                      <p className="text-sm font-black font-mono uppercase tracking-widest text-white">{member.cyberName || "Unknown"}</p>
                    </div>
                  </div>

                  {/* Backstory */}
                  {member.cyberBackstory && (
                    <p className="text-[11px] leading-relaxed text-indigo-250 opacity-90 mb-4 font-sans relative z-10">
                      {member.cyberBackstory}
                    </p>
                  )}
                </div>

                {/* Special Ability Banner - Highlight block at the bottom */}
                {member.cyberSpecialAbility && (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/25 p-2.5 font-mono text-[9px] text-yellow-400 relative z-10 mt-auto uppercase tracking-wide">
                    <p className="font-bold text-[8px] text-yellow-500/75">SPECIAL ABILITY // SYSTEM UTILITY</p>
                    <p className="mt-0.5 leading-snug">{member.cyberSpecialAbility}</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Quick Actions Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 shadow-xl relative">
              <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 mb-4">
                // Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button 
                  onClick={handleShare}
                  className="w-full py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-850 text-xs font-mono uppercase tracking-wider text-zinc-350 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition duration-300"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#CCFF00]" /> Link Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" /> Share Profile
                    </>
                  )}
                </button>
                <button 
                  onClick={handleSaveLink}
                  className="w-full py-2 border border-zinc-850 hover:border-zinc-750 bg-black/40 hover:bg-zinc-900 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition duration-300"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#CCFF00]" /> Saved to Clipboard
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" /> Save Profile Link
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <CyberKavachLogo animateDrawing={false} />
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} CyberKavach. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
