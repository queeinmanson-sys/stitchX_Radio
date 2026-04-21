"use client";

import InspectionDashboard from "@/components/inspection-dashboard";

export default function Page() {
  return (
    <InspectionDashboard
      backendUrl="https://your-real-railway-url.up.railway.app"
      role="admin"
    />
  );
}
