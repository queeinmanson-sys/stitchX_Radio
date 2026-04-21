"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const signIn = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold text-white">Sign in</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
      />
      <button
        onClick={signIn}
        disabled={submitting}
        className="rounded-xl bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Signing in..." : "Login"}
      </button>
    </div>
  );
}
