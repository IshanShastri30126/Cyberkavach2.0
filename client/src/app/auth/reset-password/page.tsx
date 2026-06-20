"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { BinarySkullBackground } from "@/components/BinarySkullBackground";
import Image from "next/image";

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The token may have expired.");
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
              <h2 className="text-xl font-bold text-white mb-2 font-mono">PASSWORD UPDATED</h2>
              <p className="text-slate-400 text-sm mb-6">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <Link href="/auth" className="ck-btn-primary w-full flex justify-center items-center gap-2">
                LOGIN NOW
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2 font-mono">NEW PASSWORD</h2>
                <p className="text-slate-400 text-sm">Enter your new secure password below</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="ck-label">New Password</label>
                  <div className="ck-input-icon-wrapper">
                    <Lock className="w-4 h-4 text-red-500/70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="ck-input ck-input-with-icon border-red-900/50 focus:border-red-500"
                      style={{ paddingRight: "3rem" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/70 hover:text-red-400 transition z-10">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="ck-label">Confirm Password</label>
                  <div className="ck-input-icon-wrapper">
                    <Lock className="w-4 h-4 text-red-500/70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="ck-input ck-input-with-icon border-red-900/50 focus:border-red-500"
                      style={{ paddingRight: "3rem" }}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-red-500 bg-red-950/50 border border-red-900/50 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <button type="submit" disabled={loading || !token} className="ck-btn-primary w-full mt-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      UPDATE PASSWORD <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
                
                {!token && (
                   <div className="text-center mt-6">
                   <Link href="/auth/forgot-password" className="text-sm text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-colors">
                     Request new reset link
                   </Link>
                 </div>
                )}
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
