"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { GoogleLogin } from "@react-oauth/google";
import { BinarySkullBackground } from "@/components/BinarySkullBackground";
import { api } from "@/lib/api";

function LoginPageContent() {
  const { login, loginWithGoogle, register, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [institute, setInstitute] = useState("");
  const [semester, setSemester] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredPending, setRegisteredPending] = useState(false);

  // Club namespaces support
  const [clubs, setClubs] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [registerNewClub, setRegisterNewClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubSlug, setNewClubSlug] = useState("");

  // Fetch all existing clubs
  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await api<{ clubs: Array<{ id: string; name: string; slug: string }> }>("/clubs");
        setClubs(data.clubs || []);
        if (data.clubs && data.clubs.length > 0) {
          setSelectedClubId(data.clubs[0].id);
        }
      } catch (err) {
        console.error("Failed to load clubs", err);
      }
    }
    loadClubs();
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (user && (user.isApproved || user.role === "GUEST")) router.push(redirectTarget);
  }, [user, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        router.push(redirectTarget);
      } else {
        await register(name, email, password, {
          studentId,
          phone,
          department,
          institute,
          semester,
          ...(registerNewClub
            ? { newClubName, newClubSlug }
            : { clubId: selectedClubId }
          )
        });
        setRegisteredPending(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError(""); setEmail(""); setPassword(""); setName(""); setStudentId("");
    setPhone(""); setDepartment(""); setInstitute(""); setSemester("");
    setRegisteredPending(false);
  };

  if (registeredPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black text-white">
        <BinarySkullBackground />
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
          <div className="ck-glass rounded-2xl p-8 shadow-2xl text-center border-red-900">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-900 via-red-600 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(255,0,0,0.5)] border border-red-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Registration Successful!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your account has been created and is pending coordinator approval.
              You&apos;ll be notified once your account is activated.
            </p>
            <button onClick={() => { setIsLogin(true); resetForm(); }} className="ck-btn-primary w-full">
              Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center lg:justify-end p-4 lg:pr-32 relative overflow-hidden bg-black text-white">
      <BinarySkullBackground />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className={`w-full ${isLogin ? "max-w-md" : "max-w-xl"} transition-all duration-300 relative z-10`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-900 via-red-600 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.6)] border border-red-500">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-widest font-mono">CYBERKAVACH</span>
          </motion.div>
          <p className="text-slate-400 text-sm">Digital Operations Hub — Secure Access</p>
        </div>

        {/* Card */}
        <div className="ck-glass rounded-xl p-8 shadow-2xl relative overflow-hidden border border-red-900/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          
          {/* Tab Toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-black/40 mb-6 border border-red-900/30">
            <button onClick={() => { setIsLogin(true); resetForm(); }} className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 font-mono tracking-widest ${isLogin ? "bg-red-950/80 text-white shadow-[0_0_10px_rgba(255,0,0,0.4)] border border-red-500/50" : "text-slate-400 hover:text-red-400"}`}>
              SIGN IN
            </button>
            <button onClick={() => { setIsLogin(false); resetForm(); }} className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 font-mono tracking-widest ${!isLogin ? "bg-red-950/80 text-white shadow-[0_0_10px_rgba(255,0,0,0.4)] border border-red-500/50" : "text-slate-400 hover:text-red-400"}`}>
              REGISTER
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={isLogin ? "login" : "register"} initial={{ opacity: 0, x: isLogin ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? 20 : -20 }} transition={{ duration: 0.3 }} onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="ck-label">Full Name</label>
                      <div className="ck-input-icon-wrapper">
                        <User className="w-4 h-4 text-red-500/70" />
                        <input type="text" placeholder="USER IDENTIFIER" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="ck-input ck-input-with-icon" />
                      </div>
                    </div>
                    <div>
                      <label className="ck-label">Student ID</label>
                      <div className="ck-input-icon-wrapper">
                        <User className="w-4 h-4 text-red-500/70" />
                        <input type="text" placeholder="e.g. 22CS101" value={studentId} onChange={(e) => setStudentId(e.target.value)} required={!isLogin} className="ck-input ck-input-with-icon" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="ck-label">Department</label>
                      <div className="ck-input-icon-wrapper">
                        <User className="w-4 h-4 text-red-500/70" />
                        <input type="text" placeholder="e.g. CSE, IT" value={department} onChange={(e) => setDepartment(e.target.value)} required={!isLogin} className="ck-input ck-input-with-icon" />
                      </div>
                    </div>
                    <div>
                      <label className="ck-label">Institute</label>
                      <div className="ck-input-icon-wrapper">
                        <User className="w-4 h-4 text-red-500/70" />
                        <input type="text" placeholder="e.g. CSPIT, DEPSTAR" value={institute} onChange={(e) => setInstitute(e.target.value)} required={!isLogin} className="ck-input ck-input-with-icon" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="ck-label">Semester</label>
                      <div className="ck-input-icon-wrapper">
                        <User className="w-4 h-4 text-red-500/70" />
                        <input type="text" placeholder="e.g. 1-8" value={semester} onChange={(e) => setSemester(e.target.value)} required={!isLogin} className="ck-input ck-input-with-icon" />
                      </div>
                    </div>
                    <div>
                      <label className="ck-label">Contact Info / Phone</label>
                      <div className="ck-input-icon-wrapper">
                        <User className="w-4 h-4 text-red-500/70" />
                        <input type="text" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required={!isLogin} className="ck-input ck-input-with-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-red-900/30 pt-4 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="ck-label font-bold text-red-400">Club Namespace</label>
                      <button
                        type="button"
                        onClick={() => setRegisterNewClub(!registerNewClub)}
                        className="text-xs text-orange-400 hover:text-orange-300 font-mono"
                      >
                        {registerNewClub ? "Join Existing Club" : "Register New Club"}
                      </button>
                    </div>

                    {!registerNewClub ? (
                      <div>
                        <label className="ck-label text-xs">Select Club to Join</label>
                        <select
                          value={selectedClubId}
                          onChange={(e) => setSelectedClubId(e.target.value)}
                          className="ck-input w-full bg-black/60 border border-red-900/50 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          {clubs.map((c) => (
                            <option key={c.id} value={c.id} className="bg-black text-white">
                              {c.name} ({c.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="ck-label text-xs">New Club Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Cyber Security Club"
                            value={newClubName}
                            onChange={(e) => {
                              setNewClubName(e.target.value);
                              // Auto-generate slug
                              setNewClubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                            }}
                            required={!isLogin && registerNewClub}
                            className="ck-input"
                          />
                        </div>
                        <div>
                          <label className="ck-label text-xs">New Club Slug</label>
                          <input
                            type="text"
                            placeholder="e.g. csc"
                            value={newClubSlug}
                            onChange={(e) => setNewClubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            required={!isLogin && registerNewClub}
                            className="ck-input font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="ck-label">{isLogin ? "Email" : "College Email ID"}</label>
                <div className="ck-input-icon-wrapper">
                  <Mail className="w-4 h-4 text-red-500/70" />
                  <input type="email" placeholder="NODE@NETWORK.LOCAL" value={email} onChange={(e) => setEmail(e.target.value)} required className="ck-input ck-input-with-icon" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="ck-label !mb-0">Password</label>
                  {isLogin && (
                    <a href="/auth/forgot-password" className="text-xs text-red-400 hover:text-red-300 font-mono transition-colors">
                      Forgot Password?
                    </a>
                  )}
                </div>
                <div className="ck-input-icon-wrapper">
                  <Lock className="w-4 h-4 text-red-500/70" />
                  <input type={showPassword ? "text" : "password"} placeholder="[ENCRYPTED_KEY]" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="ck-input ck-input-with-icon border-red-900/50 focus:border-red-500" style={{ paddingRight: "3rem" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/70 hover:text-red-400 transition z-10">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{isLogin ? "AUTHENTICATE" : "INITIALIZE"}<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setLoading(true);
                    try {
                      await loginWithGoogle(credentialResponse.credential);
                      router.push(redirectTarget);
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : "Google Login Failed");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                onError={() => setError("Google Login Failed")}
                theme="filled_black"
                shape="pill"
              />
            </div>
          </div>
        </div>


      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

