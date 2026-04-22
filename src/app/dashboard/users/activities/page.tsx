"use client";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-outfit text-dark">
          Activities Management
        </h1>
        <p className="text-slate text-sm">
          Track user activities and system logs
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-border shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center text-slate">
          <p className="text-lg font-medium">
            Activities log will be displayed here
          </p>
          <p className="text-sm opacity-60">
            This module is currently under development
          </p>
        </div>
      </div>
    </div>
  );
}
