"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Shield, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { BinarySkullBackground } from "@/components/BinarySkullBackground";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center lg:justify-end p-4 lg:pr-32 relative overflow-hidden bg-black text-white">
      <BinarySkullBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md transition-all duration-300 relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-4">
            <div className="w-16 h-16 relative">
              <Image src="/ck-logo.svg" alt="CyberKavach Logo" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col items-start justify-center pt-1">
              <span className="text-3xl font-black tracking-[0.15em] font-mono leading-none">
                <span className="text-white">CYBER</span><span className="text-[#FF003C]">KAVACH</span>
              </span>
              <span className="text-[11px] font-bold text-[#CCFF00] tracking-[0.25em] font-mono mt-2">
                CYBER SECURITY CLUB
              </span>
            </div>
          </motion.div>
        </div>

        {/* Card */}
        <div className="ck-glass rounded-xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-red-900/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-900 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-mono">REQUEST SENT</h2>
              <p className="text-slate-400 text-sm mb-6">
                If an account exists for <span className="text-white">{email}</span>, you will receive an email with password reset instructions.
              </p>
              <Link href="/auth" className="ck-btn-primary w-full flex justify-center items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> RETURN TO LOGIN
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2 font-mono">RESET PASSWORD</h2>
                <p className="text-slate-400 text-sm">Enter your email to receive reset instructions</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="ck-label">Email Address</label>
                  <div className="ck-input-icon-wrapper">
                    <Mail className="w-4 h-4 text-red-500/70" />
                    <input
                      type="email"
                      placeholder="NODE@NETWORK.LOCAL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="ck-input ck-input-with-icon"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-red-500 bg-red-950/50 border border-red-900/50 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <button type="submit" disabled={loading} className="ck-btn-primary w-full mt-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      SEND INSTRUCTIONS <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>

                <div className="text-center mt-6">
                  <Link href="/auth" className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
