"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Users, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    api<any>("/settings/landing-team").then((res) => {
      if (res.team) setTeam(res.team);
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans relative">
      
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-white/10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-900 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-500/50">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-widest font-mono hidden sm:inline-block">CYBERKAVACH</span>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/auth" className="px-5 py-2 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform">Sign In</Link>
        </motion.div>
      </header>

      <main className="relative z-10 pt-16 pb-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/30 text-red-400 text-xs font-mono mb-6 uppercase tracking-wider"
          >
            Core Committee
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-br from-white via-slate-200 to-red-500/50 bg-clip-text text-transparent"
          >
            Meet the Crew
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
          >
            The brilliant minds behind CyberKavach. Our faculty and student coordinators drive innovation, excellence, and the vision of a connected digital ecosystem.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", damping: 15 }}
              className="group relative rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center hover:bg-white/10 transition-all duration-500 overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(220,38,38,0.15)]"
            >
              {/* 3D Hover Effect Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/0 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-red-500 transition-colors shadow-2xl">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Users className="w-10 h-10 text-zinc-500" />
                  </div>
                )}
              </div>
              <h3 className="relative z-10 text-2xl font-bold mb-1">{member.name}</h3>
              <p className="relative z-10 text-xs font-mono text-red-400 mb-2 px-3 py-1 bg-red-500/10 rounded-full inline-block border border-red-500/20">{member.role.replace("_", " ")}</p>
              <p className="relative z-10 text-sm text-slate-400 mt-2">{member.designation}</p>
            </motion.div>
          ))}
        </div>
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
