
'use client';

import { ToastProvider } from "@/components/stitchx-toast";
import { InspectionProvider } from "@/components/inspection-context";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/login";
const RaceControlDashboard = dynamic(() => import("@/components/race-control-dashboard"), { ssr: false });

export default function Page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };
    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Restoring session...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ToastProvider>
      <InspectionProvider>
        <RaceControlDashboard user={user} />
      </InspectionProvider>
    </ToastProvider>
  );
}
