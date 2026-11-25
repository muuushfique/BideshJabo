"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid admin credentials");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Network error while signing in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 subtle-grid">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">BideshJabo Admin</h1>
              <p className="text-xs text-muted-foreground">
                Protected Operations &amp; Currency Console
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> App
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Admin Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bideshjabo.com"
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Admin Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Verifying..." : "Sign In to Admin Console"}
          </Button>
        </form>

        <div className="rounded-xl border border-border bg-background/60 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
          <Globe2 className="h-4 w-4 shrink-0 text-indigo-400" />
          <span>
            Configured via <code className="font-mono">ADMIN_EMAIL</code> &amp;{" "}
            <code className="font-mono">ADMIN_PASSWORD</code> environment variables (see README).
          </span>
        </div>
      </Card>
    </div>
  );
}
