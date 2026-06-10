"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { ShieldCheck, ShieldX, Shield, Calendar, Award, Copy, Check, Download, ExternalLink, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: '1em', height: '1em' }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// Scrambler/Decryption text animation component
const DecryptedText = ({ text, delay = 35 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "!@#$%^&*()_+{}:<>?|[];',./~`=-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  useEffect(() => {
    if (!text) return;
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (index < iterations) {
              return text[index];
            }
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iterations >= text.length) {
        clearInterval(interval);
      }
      iterations += 1 / 4; // Resolve slowly
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return <span className="font-mono">{displayText}</span>;
};

export default function VerifyPage() {
  const params = useParams();
  const code = params.code as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Interactive 3D Card states
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await api<any>(`/certificates/verify/${code}`);
        setResult(data);
      } catch { 
        setResult({ valid: false }); 
      } finally { 
        setLoading(false); 
      }
    };
    verify();
  }, [code]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates around center (0,0)
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    // Tilt limit: 12 degrees
    const rotateX = -((y - yc) / yc) * 12;
    const rotateY = ((x - xc) / xc) * 12;

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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLinkedInShareUrl = () => {
    if (!result?.certificate) return "#";
    const cert = result.certificate;
    const date = new Date(cert.generatedAt || Date.now());
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const verifyUrl = window.location.href;
    const name = `${cert.eventTitle} Certification`;
    const org = cert.issuingAuthority || "CyberKavach Club";
    
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(name)}&organizationName=${encodeURIComponent(org)}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.uniqueCode)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 gap-4">
        <RefreshCw className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-xs font-mono text-red-500 uppercase tracking-widest animate-pulse">Cryptographic Secure Verification In Progress...</p>
      </div>
    );
  }

  return (
    <div className="ck-gradient-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glowing blobs */}
      <div className="absolute top-20 left-20 w-80 h-80 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-2xl relative z-10 my-8">
        
        {/* Secure Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2 bg-black/40 border border-red-950/40 px-4 py-2 rounded-full backdrop-blur">
            <Shield className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-sm font-mono font-bold tracking-widest text-red-500 uppercase">CyberKavach Trust Verify Unit</span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">SECURE CREDENTIAL VALIDATION NETWORK</p>
        </div>

        {/* 3D Holographic Certificate Card & Verification Info */}
        <div className="space-y-6">
          {result?.valid ? (
            <>
              {/* INTERACTIVE 3D HOLOGRAM CARD */}
              <div 
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={tiltStyle}
                className="relative overflow-hidden cursor-pointer w-full aspect-[8/5.3] max-w-lg mx-auto rounded-2xl border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.05)] bg-gradient-to-br from-zinc-900 to-black p-6 sm:p-8 flex flex-col justify-between transform-style-3d select-none"
              >
                {/* Holographic spotlight shine effect */}
                {isHovered && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                      background: `radial-gradient(circle 180px at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.08), transparent 80%)`
                    }}
                  />
                )}

                {/* Animated Green Scanning Laser Line */}
                <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981] pointer-events-none z-10"
                  style={{
                    animation: "laser-sweep 4s linear infinite",
                    position: "absolute"
                  }}
                />

                {/* Card Top Border Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 opacity-60" />

                {/* Cyber Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Secure Certificate Verified</span>
                  </div>
                  <Award className="w-8 h-8 text-amber-500/60" />
                </div>

                {/* Certificate Core Info */}
                <div className="my-auto space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">CERTIFICATE HOLDER</span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize">
                      <DecryptedText text={result.certificate.recipientName} />
                    </h2>
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">FOR OUTSTANDING ACHIEVEMENT IN</span>
                    <p className="text-xs sm:text-sm font-mono text-slate-300 font-bold uppercase tracking-wide truncate">
                      {result.certificate.eventTitle}
                    </p>
                  </div>
                </div>

                {/* Cyber Card Footer */}
                <div className="flex justify-between items-end border-t border-zinc-800/80 pt-4">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">DATE ISSUED</span>
                    <p className="text-[10px] font-mono text-slate-300">
                      {new Date(result.certificate.eventDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric"
                      }).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">VERIFICATION ID</span>
                    <p className="text-[10px] font-mono text-red-400 font-bold">{result.certificate.uniqueCode}</p>
                  </div>
                </div>
              </div>

              {/* ACTION TOOLKIT */}
              <div className="ck-glass rounded-2xl p-6 sm:p-8 space-y-6 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-2 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" /> Cryptographic Integrity Check Passed
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">This certificate has been cryptographically signed and stored in the vault, confirming its absolute authenticity.</p>
                </div>

                {/* Info Fields Detail */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                  <div>
                    <span className="text-slate-500">AUTHORITY:</span>
                    <p className="text-slate-300 font-bold">{result.certificate.issuingAuthority}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">VERIFIED AT:</span>
                    <p className="text-slate-300 font-bold">{new Date(result.certificate.generatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Sharing Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={copyLink}
                    className="ck-btn-secondary w-full text-xs font-mono py-2.5 flex justify-center items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> Link Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Verify Link
                      </>
                    )}
                  </button>

                  <a 
                    href={getLinkedInShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#0077b5] text-white hover:bg-[#006295] py-2.5 px-4 rounded-lg text-xs font-bold font-mono transition flex justify-center items-center gap-2 uppercase tracking-wider cursor-pointer border border-[#0091db]"
                  >
                    <LinkedinIcon className="w-4 h-4 fill-white" /> Add to LinkedIn
                  </a>
                </div>
              </div>
            </>
          ) : (
            /* INVALID/TAMPERED VIEW */
            <div className="ck-card max-w-md mx-auto p-8 text-center bg-black/40 border-red-500/30">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <ShieldX className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-red-500 mb-2 font-mono uppercase tracking-wider">⚠️ Verification Failed</h2>
              <p className="text-sm text-slate-400 font-mono mb-4">
                {result?.tampered 
                  ? "WARNING: THIS CERTIFICATE CHECKSUM DOES NOT MATCH CURRENT DATA! TAMPERING OR CORRUPTION DETECTED." 
                  : "NO CREDENTIAL RECORD CORRESPONDING TO THIS UNIQUE CODE EXISTS IN THE VAULT."}
              </p>
              <div className="text-[10px] font-mono text-slate-600 bg-red-950/10 p-3 rounded-lg border border-red-950/20">
                Error Code: Validation Checksum Mismatch // ID: {code}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styled animation logic in CSS */}
      <style jsx global>{`
        @keyframes laser-sweep {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
