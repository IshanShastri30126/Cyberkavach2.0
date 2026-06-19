"use client";

import React, { useEffect, useState } from "react";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Calendar, Trophy, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

interface MyCertificate {
  id: string;
  uniqueCode: string;
  recipientName: string;
  status: string;
  generatedAt: string;
  fileUrl?: string;
  event: {
    title: string;
    startDate: string;
  };
}

const CertificateTiltCard = ({ 
  cert, 
  token, 
  index, 
  handleDownload 
}: { 
  cert: MyCertificate; 
  token: string | null; 
  index: number; 
  handleDownload: (cert: MyCertificate) => void 
}) => {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const rotateX = -((y - yc) / yc) * 8; // max 8 degrees rotation
    const rotateY = ((x - xc) / xc) * 8; 

    setCoords({ x, y });
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: "none"
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg)`,
      transition: "transform 0.5s ease-out"
    });
  };

  const getLinkedInShareUrl = () => {
    const date = new Date(cert.generatedAt || Date.now());
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // Construct absolute verify URL
    const verifyUrl = `${window.location.origin}/verify/${cert.uniqueCode}`;
    const name = `${cert.event.title} Certification`;
    const org = "CyberKavach Club";
    
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(name)}&organizationName=${encodeURIComponent(org)}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.uniqueCode)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className="ck-holo-card p-6 flex flex-col cursor-pointer select-none"
    >
      {/* Holographic light reflect overlay */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle 100px at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.08), transparent 80%)`
          }}
        />
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4 z-10">
        <div className="p-3 bg-[#CCFF00]/10 rounded-xl border border-[#CCFF00]/25">
          <Award className="w-6 h-6" style={{ color: "#CCFF00" }} />
        </div>
        <span className="text-[10px] font-mono px-2 py-1 bg-zinc-900 text-slate-300 rounded border border-zinc-800">
          {cert.uniqueCode}
        </span>
      </div>
      
      {/* Core details */}
      <div className="flex-1 z-10">
        <h3 className="text-base font-bold text-white font-mono uppercase tracking-tight mb-2 line-clamp-2">
          {cert.event.title}
        </h3>
        <p className="text-[10px] text-slate-400 flex items-center gap-2 mb-4">
          <Calendar className="w-3.5 h-3.5" style={{ color: "#FF4D00" }} />
          {new Date(cert.event.startDate).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
          })}
        </p>
      </div>

      {/* Sharing controls */}
      <div className="flex flex-col gap-2 pt-4 border-t border-zinc-850 mt-4 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload(cert)}
            className="flex-1 ck-btn-secondary text-[10px] py-1.5 flex justify-center items-center gap-1.5 font-mono font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <a
            href={`/verify/${cert.uniqueCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-300 text-[10px] hover:bg-zinc-800 hover:text-white transition flex items-center gap-1.5 font-mono font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Verify
          </a>
        </div>
        
        {/* Add to LinkedIn action */}
        <a
          href={getLinkedInShareUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#0077b5] text-white hover:bg-[#006295] py-2 px-3 rounded-lg text-[10px] font-bold font-mono transition flex justify-center items-center gap-1.5 border border-[#0091db] cursor-pointer"
        >
          <LinkedinIcon className="w-3.5 h-3.5 fill-white" /> Add to LinkedIn
        </a>
      </div>
    </motion.div>
  );
};

export default function MyCertificatesPage() {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState<MyCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchCertificates = async () => {
      try {
        const data = await api<{ certificates: MyCertificate[] }>("/certificates/my-certificates", { token });
        setCertificates(data.certificates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [token]);

  const handleDownload = (cert: MyCertificate) => {
    window.open(`${SERVER_BASE_URL}/api/certificates/${cert.id}/download?token=${token}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="ck-spinner" />
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 animate-pulse">LOADING CERTIFICATE VAULT...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold animate-pulse" style={{ color: "#CCFF00" }}>ACHIEVEMENT VAULT</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">MY <span className="ck-gradient-text">CERTIFICATES</span></h1>
          <p className="mt-1 text-xs text-zinc-500 font-mono">
            {certificates.length > 0 ? <span style={{ color: "#CCFF00" }}>{certificates.length} ACHIEVEMENT{certificates.length > 1 ? "S" : ""} UNLOCKED</span> : "NO ACHIEVEMENTS YET"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#CCFF00]/15 bg-[#CCFF00]/5 text-[#CCFF00]">
          <Sparkles className="w-4 h-4 text-[#CCFF00] animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase">VERIFIED SECURE CERTS</span>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[#CCFF00]/10 rounded-full blur-3xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950/30 to-black flex items-center justify-center">
              <Trophy className="w-10 h-10" style={{ color: "#CCFF00" }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-zinc-400 font-mono">VAULT EMPTY</p>
            <p className="text-xs text-zinc-650 mt-1 max-w-xs font-mono">No achievements yet. Participate in events to earn verified certificates.</p>
          </div>
          <Link href="/dashboard/events"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#CCFF00] text-black text-xs font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          >
            EXPLORE EVENTS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, i) => (
            <CertificateTiltCard 
              key={cert.id} 
              cert={cert} 
              token={token} 
              index={i} 
              handleDownload={handleDownload} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
