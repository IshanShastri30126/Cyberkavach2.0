"use client";

import React, { useEffect, useState } from "react";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";

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
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-mono uppercase">My Certificates</h1>
        <p className="mt-2 text-sm text-slate-400">View and download certificates from events you've participated in.</p>
      </div>

      {certificates.length === 0 ? (
        <div className="ck-card p-12 text-center bg-black/40 border-red-950/30">
          <Award className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-widest">No Certificates Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You haven't earned any certificates yet. Participate in events to earn certificates!
          </p>
          <Link href="/events" className="ck-btn-primary inline-flex mt-6">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="ck-card p-6 bg-black/40 border-red-950/30 flex flex-col hover:border-red-500/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-950/30 rounded-xl border border-red-900/30">
                  <Award className="w-6 h-6 text-red-500" />
                </div>
                <span className="text-xs font-mono px-2 py-1 bg-zinc-900 text-slate-300 rounded border border-zinc-800">
                  {cert.uniqueCode}
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight mb-2 line-clamp-2">
                  {cert.event.title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  {new Date(cert.event.startDate).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-red-950/40 mt-4">
                <button
                  onClick={() => handleDownload(cert)}
                  className="flex-1 ck-btn-secondary text-xs flex justify-center items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <a
                  href={`/verify/${cert.uniqueCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-slate-300 text-xs hover:bg-zinc-800 hover:text-white transition flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Verify
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
