"use client";

import { useState } from "react";

import toast, { Toaster } from "react-hot-toast";
import { Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success("Logged in successfully");
        window.location.href = "/admin";
        return; // Prevent setLoading(false) to avoid state update during redirect
      } else {
        const data = await res.json();
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during authentication");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <Toaster position="top-right" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 ease-out">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/images/logo.png" alt="Radhey Metal Alloys" className="h-16 w-auto object-contain dark:invert mb-4" />
          <h1 className="text-xl font-medium text-text-primary tracking-tight">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-text-muted font-light">
            Sign in to manage catalog, categories, and content
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface/80 backdrop-blur-md rounded-[var(--outer-radius)] border border-border-subtle shadow-lg p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="radhemetalalloysllp@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-background border border-border-base rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-background border border-border-base rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus transition-all hover:bg-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold hover:opacity-90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all duration-300 shadow-xl group"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-text-muted font-light">
          Protected Portal &bull; Radhey Metal Alloys LLP
        </p>
      </div>
    </div>
  );
}
