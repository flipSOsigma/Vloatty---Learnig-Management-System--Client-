"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/views/Header";
import Link from "next/link";
import { useLms } from "../../../context/LmsContext";
import {
  User,
  Mail,
  Building,
  Award,
  Copy,
  Check,
  ArrowLeft,
  Key,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  premiumStatus: "free" | "premium" | "professional";
  institution: string;
  avatar: string;
}

interface JwtReplica {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useLms();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jwt, setJwt] = useState<JwtReplica | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "jwt" | "security">("info");
  
  // Form edit states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [premiumStatus, setPremiumStatus] = useState<"free" | "premium" | "professional">("free");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync profile form fields with LmsContext user state
  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      setName(currentUser.name);
      setEmail(currentUser.email);
      setInstitution(currentUser.institution || "");
      setPremiumStatus(currentUser.premiumStatus);
    }
  }, [currentUser]);

  // Load JWT token from localStorage or fallback to mock user.json
  useEffect(() => {
    const activeToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (activeToken) {
      setJwt({
        accessToken: activeToken,
        tokenType: "Bearer",
        expiresIn: 86400
      });
    } else {
      fetch("/data/user.json")
        .then((res) => res.json())
        .then((data) => {
          if (data.jwt) {
            setJwt(data.jwt);
          }
        })
        .catch((err) => console.error("Error fetching mock user jwt:", err));
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      
      const response = await fetch(`${API_BASE_URL}/users/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name,
          email,
          institution,
          premiumStatus,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save profile on server");
      }

      const updatedUser = await response.json();
      setProfile(updatedUser);
      if (setCurrentUser) {
        setCurrentUser(updatedUser);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToken = () => {
    if (!jwt) return;
    navigator.clipboard.writeText(jwt.accessToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JWT Decoding Simulation
  const getDecodedPayload = () => {
    if (!profile) return "{}";
    return JSON.stringify(
      {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        premiumStatus: profile.premiumStatus,
        institution: profile.institution,
        iat: 1783900000,
        exp: 1783900000 + (jwt?.expiresIn || 86400),
      },
      null,
      2
    );
  };

  const getDecodedHeader = () => {
    return JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2);
  };

  if (!profile || !jwt) {
    return (
      <div className="flex flex-col gap-6 text-left">
        <Header />
        <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#E5E1D8] rounded-3xl p-6 bg-white/10 select-none">
          <span className="text-[14px] text-zinc-400 font-semibold animate-pulse">Loading profile settings...</span>
        </div>
      </div>
    );
  }

  // Premium status styling
  const premiumConfig = {
    free: {
      label: "Free Plan",
      color: "bg-zinc-200 text-zinc-700 border-zinc-300",
      accent: "text-zinc-600",
      bgLight: "bg-zinc-100/30",
    },
    premium: {
      label: "Premium",
      color: "bg-[#f25c88]/10 text-[#f25c88] border-[#f25c88]/20",
      accent: "text-[#f25c88]",
      bgLight: "bg-[#f25c88]/5",
    },
    professional: {
      label: "Professional",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      accent: "text-amber-700",
      bgLight: "bg-amber-50/40",
    },
  }[profile.premiumStatus];

  return (
    <div className="flex flex-col gap-6 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header Panel */}
      <Header />

      {/* Navigation and Title */}
      <div className="flex items-center justify-between mt-1 text-left">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E1D8] rounded-full hover:bg-zinc-100 font-bold text-[12px] text-zinc-700 cursor-pointer transition-colors shadow-sm bg-white/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          User Settings
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        {/* Left Column: Premium User Card & Profile Summary */}
        <div className="lg:col-span-1 bg-white/40 border border-[#E5E1D8]/60 p-6 rounded-3xl flex flex-col gap-6 shadow-sm">
          {/* Avatar and Info */}
          <div className="flex flex-col items-center gap-4 text-center pb-5 border-b border-[#E5E1D8]/60">
            <div className="w-20 h-20 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold text-3xl shadow-md border-4 border-[#FAF7F2]">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-black text-[#121212] tracking-tight">
                {profile.name}
              </h2>
              <span className="text-[12px] text-zinc-400 font-semibold">
                {profile.email}
              </span>
            </div>

            {/* Plan Badge */}
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full border ${premiumConfig.color}`}
            >
              <Award className="w-3 h-3" />
              {premiumConfig.label}
            </span>
          </div>

          {/* Quick Details Stats */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[12px] bg-[#FAF7F2]/40 p-3 rounded-xl border border-[#E5E1D8]/20">
              <span className="font-semibold text-zinc-400">Institution</span>
              <span className="font-bold text-zinc-800">
                {profile.institution || "Not Configured"}
              </span>
            </div>

            <div className="flex justify-between items-center text-[12px] bg-[#FAF7F2]/40 p-3 rounded-xl border border-[#E5E1D8]/20">
              <span className="font-semibold text-zinc-400">Security Mode</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Replicated JWT
              </span>
            </div>
          </div>

          {/* Tab Selector Links */}
          <div className="flex flex-col gap-1 bg-[#EFECE6]/50 p-1.5 border border-[#E5E1D8]/50 rounded-2xl">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all cursor-pointer ${
                activeTab === "info"
                  ? "bg-[#121212] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200/40"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Information</span>
            </button>

            <button
              onClick={() => setActiveTab("jwt")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all cursor-pointer ${
                activeTab === "jwt"
                  ? "bg-[#121212] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200/40"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>JWT Token Replica</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-[#121212] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200/40"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Account Credentials</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tab View Panels */}
        <div className="lg:col-span-2">
          {/* TAB 1: PERSONAL INFORMATION EDIT */}
          {activeTab === "info" && (
            <div className="bg-white/40 border border-[#E5E1D8]/60 p-6 rounded-3xl flex flex-col gap-6 shadow-sm animate-in fade-in duration-200">
              <div>
                <h3 className="text-[16px] font-black text-zinc-950">
                  Personal Information
                </h3>
                <p className="text-[11.5px] text-zinc-400 font-semibold mt-0.5">
                  Manage your display name, institution configurations, and membership plan.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                      Display Name
                    </label>
                    <div className="flex items-center bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2.5 gap-2.5">
                      <User className="w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-transparent border-none outline-none text-[13px] text-zinc-800 font-bold w-full"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                      Email Address
                    </label>
                    <div className="flex items-center bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2.5 gap-2.5 opacity-70">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="bg-transparent border-none outline-none text-[13px] text-zinc-500 font-bold w-full cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Institution field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                      Institution Name
                    </label>
                    <div className="flex items-center bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2.5 gap-2.5">
                      <Building className="w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="E.g. Vloatty University"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="bg-transparent border-none outline-none text-[13px] text-zinc-800 font-bold w-full placeholder-zinc-300"
                      />
                    </div>
                  </div>

                  {/* Premium Status Plan Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                      Membership Plan
                    </label>
                    <div className="flex items-center bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2 gap-2">
                      <Award className="w-4 h-4 text-zinc-400 pl-1" />
                      <select
                        value={premiumStatus}
                        onChange={(e) => setPremiumStatus(e.target.value as any)}
                        className="bg-transparent border-none outline-none text-[13px] text-zinc-800 font-bold w-full py-1 cursor-pointer"
                      >
                        <option value="free">Free Plan</option>
                        <option value="premium">Premium Plan</option>
                        <option value="professional">Professional Plan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Row */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#E5E1D8]/60">
                  {saveSuccess && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                      ✓ Settings updated successfully!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#121212] text-white font-bold rounded-2xl text-[12.5px] cursor-pointer hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? "Saving changes..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: JWT REPLICA DATA VIEW */}
          {activeTab === "jwt" && (
            <div className="bg-white/40 border border-[#E5E1D8]/60 p-6 rounded-3xl flex flex-col gap-5 shadow-sm animate-in fade-in duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[16px] font-black text-zinc-950 flex items-center gap-1.5">
                    JWT Token Replica
                    <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-extrabold uppercase">
                      Dev Tool
                    </span>
                  </h3>
                  <p className="text-[11.5px] text-zinc-400 font-semibold mt-0.5">
                    This payload replicates the exact JWT authorization string passed by the backend services.
                  </p>
                </div>

                {/* Copy Access Token */}
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 px-3 py-1.5 border border-[#E5E1D8] hover:bg-zinc-100 rounded-xl font-bold text-[10px] text-zinc-600 bg-white/60 cursor-pointer transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy JWT</span>
                    </>
                  )}
                </button>
              </div>

              {/* Raw JWT Token */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider pl-1">
                  Replicated Access Token (Bearer)
                </span>
                <div className="bg-[#121212] p-4 rounded-2xl border border-zinc-800 text-[11px] font-mono text-zinc-300 break-all leading-normal select-text max-h-[100px] overflow-y-auto">
                  {jwt.accessToken}
                </div>
              </div>

              {/* Simulated JWT Decoder Structure */}
              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Simulated JWT Token Decoder
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Header Segment */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9.5px] font-extrabold text-rose-500 uppercase tracking-wider pl-1">
                      Header (Algorithm & Type)
                    </span>
                    <pre className="bg-[#121212] p-4 rounded-2xl border border-zinc-800 text-[11px] font-mono text-rose-400 overflow-x-auto text-left">
                      {getDecodedHeader()}
                    </pre>
                  </div>

                  {/* Payload Segment */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9.5px] font-extrabold text-indigo-400 uppercase tracking-wider pl-1">
                      Payload (Decoded Claims)
                    </span>
                    <pre className="bg-[#121212] p-4 rounded-2xl border border-zinc-800 text-[11px] font-mono text-indigo-300 overflow-x-auto text-left">
                      {getDecodedPayload()}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT SECURITY */}
          {activeTab === "security" && (
            <div className="bg-white/40 border border-[#E5E1D8]/60 p-6 rounded-3xl flex flex-col gap-6 shadow-sm animate-in fade-in duration-200">
              <div>
                <h3 className="text-[16px] font-black text-zinc-950">
                  Account Credentials
                </h3>
                <p className="text-[11.5px] text-zinc-400 font-semibold mt-0.5">
                  Update your authentication parameters and security settings.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    disabled
                    value="••••••••••••••••"
                    className="bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2.5 text-[13px] text-zinc-400 font-bold w-full cursor-not-allowed opacity-75"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      disabled
                      className="bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2.5 text-[13px] text-zinc-300 font-bold w-full cursor-not-allowed opacity-75 placeholder-zinc-300"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider pl-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      disabled
                      className="bg-[#FAF7F2] border border-[#E5E1D8] rounded-2xl px-3.5 py-2.5 text-[13px] text-zinc-300 font-bold w-full cursor-not-allowed opacity-75 placeholder-zinc-300"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200/50 rounded-2xl mt-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-[11.5px] text-amber-800 leading-normal font-semibold">
                    Credential modifications are disabled in mock demo environment. Integrate with the credentials service provider in production to adjust passwords.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
