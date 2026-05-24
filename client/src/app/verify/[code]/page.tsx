"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ShieldCheck, ShieldX, Shield, Calendar, Award } from "lucide-react";

export default function VerifyPage() {
  const params = useParams();
  const code = params.code as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await api<any>(`/certificates/verify/${code}`);
        setResult(data);
      } catch { setResult({ valid: false }); }
      finally { setLoading(false); }
    };
    verify();
  }, [code]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ck-bg)" }}><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="ck-gradient-bg min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="text-xl font-bold text-white">CyberKavach</span>
          </div>
          <p className="text-sm text-slate-400">Certificate Verification</p>
        </div>
        <div className="ck-glass rounded-2xl p-8 shadow-2xl text-center">
          {result?.valid ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">✅ Valid Certificate</h2>
              <p className="text-sm text-slate-400 mb-6">This certificate is authentic and verified.</p>
              <div className="text-left space-y-3 bg-white/5 rounded-xl p-5">
                <div><p className="text-xs text-slate-500">Recipient</p><p className="text-sm font-medium text-white">{result.certificate.recipientName}</p></div>
                <div><p className="text-xs text-slate-500">Event</p><p className="text-sm font-medium text-white">{result.certificate.eventTitle}</p></div>
                <div><p className="text-xs text-slate-500">Date</p><p className="text-sm text-slate-300">{new Date(result.certificate.eventDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-500">Certificate ID</p><p className="text-sm font-mono text-indigo-400">{result.certificate.uniqueCode}</p></div>
                <div><p className="text-xs text-slate-500">Issued By</p><p className="text-sm text-slate-300">{result.certificate.issuingAuthority}</p></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <ShieldX className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">❌ Invalid Certificate</h2>
              <p className="text-sm text-slate-400">{result?.tampered ? "This certificate may have been tampered with." : "No certificate found with this code."}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
