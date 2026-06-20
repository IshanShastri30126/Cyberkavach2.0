"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CyberKavachLogo } from "@/components/CyberKavachLogo";
import { 
  Shield, 
  ChevronRight, 
  Calendar, 
  Code,
  Network,
  ArrowRight, 
  Info, 
  Users, 
  LogIn, 
  FileText 
} from "lucide-react";
import { api, getFileUrl } from "@/lib/api";
import PlexusBackground from "@/components/PlexusBackground";


interface EventItem {
  id: string;
  title: string;
  description?: string;
  posterUrl?: string;
  startDate: string;
  slug: string;
  documentUrl?: string;
}

const LinkedinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: "1em", height: "1em" }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: "1em", height: "1em" }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const WhatsappIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: "1em", height: "1em" }}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.906-6.99C16.558 1.876 14.077.845 11.442.845 6.008.845 1.585 5.26 1.581 10.697c-.001 1.716.452 3.39 1.312 4.869l-.993 3.629 3.71-.973zm11.567-7.25c-.314-.157-1.859-.917-2.128-1.015-.27-.099-.465-.147-.659.148-.195.295-.754.95-.923 1.147-.17.197-.339.221-.653.064-1.294-.648-2.14-1.127-2.99-2.585-.224-.384.224-.356.643-1.198.07-.141.035-.264-.018-.372-.054-.108-.465-1.118-.637-1.532-.167-.403-.35-.347-.481-.353-.125-.006-.27-.008-.415-.008-.146 0-.383.055-.584.275-.2.22-.765.75-.765 1.83 0 1.078.784 2.12.893 2.27.109.15 1.543 2.356 3.738 3.302.522.224.93.359 1.249.46.525.166 1.002.143 1.379.088.42-.062 1.859-.76 2.128-1.492.27-.731.27-1.357.19-1.492-.08-.135-.295-.221-.609-.378z" />
  </svg>
);

const TypingText = () => {
  const words = ["Digital Age.", "Enterprise.", "Modern Cyber Era.", "Threat Landscape."];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
      setText(words[index].substring(0, subIndex + (isDeleting ? -1 : 1)));
    }, isDeleting ? 40 : 90);

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, index]);

  return (
    <span 
      className="inline-block text-[#FF0000] border-r-3 border-[#FF0000] animate-cursor-blink pr-1.5"
      style={{
        textShadow: "0 0 15px rgba(255, 0, 0, 0.85), 0 0 35px rgba(255, 0, 0, 0.45)",
      }}
    >
      {text}
    </span>
  );
};

function EventCard({ ev, i }: { ev: EventItem; i: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="group relative rounded-xl bg-[#0D0F14]/40 backdrop-blur-md border border-zinc-800/80 overflow-hidden hover:border-[#FF0000]/50 hover:shadow-[0_0_35px_rgba(255,0,0,0.15)] flex flex-col h-full transition-all duration-300"
    >
      {/* Spotlight Overlay Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: "radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 0, 0, 0.08), transparent 80%)"
        }}
      />

      {/* Networking Dots Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#FF0000 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px"
        }}
      />

      {/* Cyber Corner Brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FF0000]/30 group-hover:border-[#FF0000] transition-colors z-20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#FF0000]/30 group-hover:border-[#FF0000] transition-colors z-20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#FF0000]/30 group-hover:border-[#FF0000] transition-colors z-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FF0000]/30 group-hover:border-[#FF0000] transition-colors z-20" />
      
      {/* Cover image or fallback */}
      <div className="h-44 bg-zinc-900 relative overflow-hidden border-b border-white/5 z-10">
        {ev.posterUrl ? (
          <img src={getFileUrl(ev.posterUrl)} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 group-hover:scale-105 transition-transform duration-500">
            {/* Networking Grid Pattern for Fallback */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#FF0000 1px, transparent 1px), linear-gradient(90deg, #FF0000 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <Network className="w-10 h-10 text-zinc-700 group-hover:text-[#FF0000]/60 transition-colors relative z-10" />
          </div>
        )}
        
        {/* Glowing status tag */}
        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded bg-black/75 border border-[#FF0000]/30 backdrop-blur-md text-[9px] font-mono font-bold tracking-widest text-[#FF0000]">
          {"//REG_ACTIVE"}
        </div>
        
        {/* Floating Date Badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/75 border border-[#FF003C]/30 backdrop-blur-md rounded text-xs font-mono font-bold text-[#FF003C]">
          {new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      
      {/* Card details */}
      <div className="p-6 flex-1 flex flex-col justify-between z-10">
        <div>
          <div className="text-[10px] font-mono text-[#FF0000]/70 uppercase mb-2 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-ping" />
            Operation Telemetry
          </div>
          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-[#FF0000] transition-colors">{ev.title}</h3>
          <p className="text-sm text-slate-400 mb-6 line-clamp-3 leading-relaxed">{ev.description || "No description provided."}</p>
        </div>
        
        {/* Action Block */}
        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
          {ev.documentUrl && (() => {
            let docs: string[] = [];
            if (ev.documentUrl.startsWith("[")) {
              try { docs = JSON.parse(ev.documentUrl); } catch { docs = [ev.documentUrl]; }
            } else { docs = [ev.documentUrl]; }
            return docs.length > 0 ? (
              <div className="flex flex-col gap-1.5 w-full bg-black/30 border border-zinc-800/40 p-2.5 rounded-lg">
                <span className="text-[8px] font-mono uppercase text-zinc-550 tracking-wider">Uploaded templates/resources:</span>
                {docs.map((doc, idx) => (
                  <a
                    key={idx}
                    href={getFileUrl(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-[#FF0000] transition truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#FF003C] shrink-0" />
                    <span className="truncate">{doc.split("/").pop()}</span>
                  </a>
                ))}
              </div>
            ) : null;
          })()}

          <div className="flex items-center justify-between mt-1 w-full">
            <span className="text-[10px] font-mono text-zinc-500">{"// REGISTRATION_ACTIVE"}</span>
            <Link href={`/events/${ev.slug}`} className="px-4 py-1.5 rounded bg-black/60 border border-zinc-800 hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-black text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] flex items-center gap-1.5 text-[#FF0000]">
              Launch Clearance <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    // Fetch Latest Events (Top 3 active)
    api<{ events: EventItem[] }>("/events?limit=3").then((res) => {
      if (res.events) {
        const publicEvents = res.events
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 3);
        setEvents(publicEvents);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-[#FF0000]/30 font-sans relative">
      
      {/* Background Plexus Canvas with Overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <PlexusBackground />
        
        {/* Readability Overlay: Add a subtle, semi-transparent black gradient layer (rgba(0,0,0,0.3)) over the plexus background */}
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Top and Bottom soft black gradients to blend the video edges with navbar and footer */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 opacity-70" />
        
        {/* Soft glowing red ambient lights to match the plexus nodes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF0000]/5 blur-[120px] z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF003C]/5 blur-[120px] z-10" />

        {/* Particles / Noise for texture */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay z-20" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <CyberKavachLogo animateDrawing={true} />
          </div>

        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-4">
          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/about" className="px-4 py-2 bg-black/40 border border-zinc-800 rounded-md text-xs font-mono uppercase hover:border-[#CCFF00]/50 hover:text-white hover:bg-zinc-900/40 transition-all duration-300 flex items-center gap-1.5 text-zinc-350">
              <Info className="w-3.5 h-3.5 text-[#CCFF00]" /> About
            </Link>
            <Link href="/team" className="px-4 py-2 bg-black/40 border border-zinc-800 rounded-md text-xs font-mono uppercase hover:border-[#CCFF00]/50 hover:text-white hover:bg-zinc-900/40 transition-all duration-300 flex items-center gap-1.5 text-zinc-350">
              <Users className="w-3.5 h-3.5 text-[#FF4D00]" /> Crew
            </Link>
            <Link href="/auth" className="px-5 py-2 bg-gradient-to-r from-[#FF4D00] to-[#CCFF00] rounded-md text-xs font-mono font-black text-black uppercase hover:shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-[1.01] transition-all duration-300 flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Link>
          </div>

          {/* Mobile Navigation Icons */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/about" className="flex items-center justify-center p-1.5 text-[#CCFF00] hover:text-white transition-colors" title="About">
              <Info className="w-5 h-5" />
            </Link>
            <Link href="/team" className="flex items-center justify-center p-1.5 text-slate-350 hover:text-[#CCFF00] transition-colors" title="Crew">
              <Users className="w-5 h-5" />
            </Link>
            <Link href="/auth" className="flex items-center justify-center p-1.5 text-slate-400 hover:text-white transition-colors" title="Sign In">
              <LogIn className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-12 sm:pt-20 pb-32 sm:pb-48 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#FF003C]/5 border border-[#FF003C]/25 text-[#FF003C] text-xs font-mono mb-8 uppercase tracking-wider max-w-full text-center"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C] animate-pulse" />
            The Ultimate Digital Operations Hub
          </motion.div>
 
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[5rem] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] xl:text-[14rem] 2xl:text-[16rem] font-black tracking-tighter mb-8 text-[#FFFFFF] select-none drop-shadow-[0_5px_15px_rgba(0,0,0,0.7)]"
            style={{ lineHeight: 1.05 }}
          >
            The Ultimate Armor <br className="hidden sm:block"/> for the <TypingText />
          </motion.h1>
 
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-3xl mb-12 select-none px-4 leading-relaxed font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            Welcome to <span className="text-[#FF003C] font-semibold drop-shadow-[0_0_10px_rgba(255,0,60,0.3)]">Cyber Kavach</span>. Where threat intelligence meets seamless event management to shield your enterprise from the unknown.
          </motion.p>
 
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-md sm:max-w-none"
          >
            <Link href="/auth" className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FF0000] to-[#FF003C] rounded-lg font-bold font-mono uppercase text-base text-black overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] hover:scale-[1.02] border border-[#FF003C]/30 flex items-center justify-center">
              <span className="relative flex items-center gap-2">
                Activate Your Shield 
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform text-black" />
              </span>
            </Link>
            <a href="#events" className="group w-full sm:w-auto px-8 py-4 bg-black/40 border border-[#FF0000]/40 rounded-lg font-bold font-mono uppercase text-base text-[#FF0000] hover:text-[#FF003C] hover:bg-zinc-900/40 hover:border-[#FF003C] transition-all hover:shadow-[0_0_20px_rgba(255,0,0,0.25)] hover:scale-[1.02] flex items-center justify-center gap-2">
              Secure Your Event Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </section>
 
        {/* Latest Events Section */}
        <section id="events" className="px-6 max-w-7xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase font-mono tracking-tight">Upcoming <span style={{ color: "#FF003C" }}>Events</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto font-sans">Discover the latest workshops, hackathons, and tech summits hosted by CyberKavach.</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center p-12 rounded-2xl bg-white/5 border border-white/10">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No public events listed at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {events.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} i={i} />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <CyberKavachLogo animateDrawing={false} />
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="https://linkedin.com/company/cyberkavach" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#CCFF00] hover:text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-all text-slate-400" title="LinkedIn">
              <LinkedinIcon className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/cyberkavach" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#CCFF00] hover:text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-all text-slate-400" title="Instagram">
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a href="https://chat.whatsapp.com/cyberkavach" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#CCFF00] hover:text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-all text-slate-400" title="WhatsApp Community">
              <WhatsappIcon className="w-5 h-5" />
            </a>
          </div>

          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} CyberKavach. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Social Links Dock */}
      <div className="fixed bottom-6 right-6 z-50 hidden sm:flex flex-col gap-3">
        <a href="https://linkedin.com/company/cyberkavach" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-[#CCFF00] text-zinc-400 hover:text-[#CCFF00] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(204,255,0,0.25)] flex items-center justify-center"
           title="CyberKavach LinkedIn">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
        <a href="https://instagram.com/cyberkavach" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-[#FF4D00] text-zinc-400 hover:text-[#FF4D00] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(255,77,0,0.25)] flex items-center justify-center"
           title="CyberKavach Instagram">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
        <a href="https://chat.whatsapp.com/cyberkavach" target="_blank" rel="noopener noreferrer"
           className="w-11 h-11 rounded-full bg-black/80 border border-zinc-800 flex items-center justify-center hover:border-[#FF003C] text-zinc-400 hover:text-[#FF003C] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(255,0,60,0.25)] flex items-center justify-center text-lg leading-none"
           title="Join WhatsApp Group">
           <span>💬</span>
         </a>
      </div>
    </div>
  );
}
