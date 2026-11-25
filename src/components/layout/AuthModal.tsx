"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudUpload, Lock, Mail, User, X } from "lucide-react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { Button } from "../ui/primitives";

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register } = useWorkspace();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);
      if (!res.ok) {
        setError(res.error || "Authentication failed");
      } else {
        setAuthModalOpen(false);
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  {mode === "register" ? "Save & Sync Workspace" : "Sign In to BideshJabo"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your guest shortlist, notes, budgets & roadmaps sync automatically.
                </p>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex rounded-xl border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Sign In
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <CloudUpload className="h-4 w-4 shrink-0" />
              <span>Local guest progress will be merged to your account on submit.</span>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {mode === "register" && (
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tasnim Rahman"
                      className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
                    />
                  </div>
                </label>
              )}

              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Email Address</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
                  />
                </div>
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Syncing Workspace..."
                  : mode === "register"
                  ? "Create Account & Sync"
                  : "Sign In & Sync"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
