"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ChevronRight, Calendar, Users, Cpu, Code, ArrowRight } from "lucide-react";
import { api, SERVER_BASE_URL } from "@/lib/api";

export default function LandingPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {

    // Fetch Latest Events (Top 3)
    api<any>("/events/all").then((res) => {
      if (res.events) {
        // Filter out drafts if any, sort by date descending
        const publicEvents = res.events
          .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 3);
        setEvents(publicEvents);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-red-500/30 font-sans">
      
      {/* 3D Cyber Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none perspective-1000 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[120px]" />
        
        {/* Animated perspective grid */}
        <div className="absolute inset-0 top-[30%] rotate-x-60 scale-150 transform-style-3d">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef444433_1px,transparent_1px),linear-gradient(to_bottom,#ef444433_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,transparent,black)] animate-[grid_20s_linear_infinite]" />
        </div>
        
        {/* Particles / Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-20" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-900 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-500/50">
            <Shield className="w-6 h-6 text-white shrink-0" />
          </div>
          <span className="text-xl font-bold tracking-widest font-mono hidden sm:block">CYBERKAVACH</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 sm:gap-6">
          <Link href="/team" className="text-xs sm:text-sm font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest">Crew</Link>
          <Link href="/auth" className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden xs:block">Sign In</Link>
          <Link href="/auth" className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)] whitespace-nowrap">Get Started</Link>
        </motion.div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/30 text-red-400 text-xs font-mono mb-8 uppercase tracking-wider"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            The Ultimate Digital Operations Hub
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white via-slate-200 to-red-500/50 bg-clip-text text-transparent"
            style={{ lineHeight: 1.1 }}
          >
            SECURE. <br className="hidden md:block"/> INNOVATE. LEAD.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12"
          >
            Join CyberKavach to manage events, teams, and earn digital certificates. Experience the next generation of club management built for speed, security, and scale.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/auth" className="group relative px-8 py-4 bg-red-600 rounded-full font-bold text-lg overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:scale-105">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative flex items-center gap-2">Join the Club <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            <a href="#events" className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
              Explore Events
            </a>
          </motion.div>
        </section>

        {/* 3D Dashboard Preview Mockup */}
        <section className="px-6 max-w-6xl mx-auto mb-32 perspective-1000">
          <motion.div 
            initial={{ opacity: 0, rotateX: 20, y: 100 }} 
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-2 shadow-[0_0_100px_rgba(220,38,38,0.15)] transform-style-3d overflow-hidden"
          >
            <div className="rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img src="/dashboard-preview.png" alt="Dashboard" className="w-full h-auto object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700 scale-105 group-hover:scale-100" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=2000&q=80'; }} />
              
              {/* Overlay Content */}
              <div className="absolute bottom-6 left-6 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 w-fit">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-medium">System Online</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Latest Events Section */}
        <section id="events" className="px-6 max-w-7xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Upcoming <span className="text-red-500">Events</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">Discover the latest workshops, hackathons, and tech summits hosted by CyberKavach.</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center p-12 rounded-2xl bg-white/5 border border-white/10">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No public events listed at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((ev, i) => (
                <motion.div 
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition-all hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(220,38,38,0.15)] flex flex-col h-full"
                >
                  <div className="h-48 bg-zinc-900 relative overflow-hidden">
                    {ev.coverImage ? (
                      <img src={`${SERVER_BASE_URL}${ev.coverImage}`} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 group-hover:scale-105 transition-transform duration-500">
                        <Code className="w-12 h-12 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-mono border border-white/10">
                      {new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 line-clamp-1">{ev.title}</h3>
                    <p className="text-sm text-slate-400 mb-6 line-clamp-3 flex-1">{ev.description || "No description provided."}</p>
                    <Link href="/auth" className="inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors mt-auto">
                      Register Now <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-500" />
          <span className="font-bold tracking-widest font-mono">CYBERKAVACH</span>
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} CyberKavach. All rights reserved.</p>
      </footer>
    </div>
  );
}
