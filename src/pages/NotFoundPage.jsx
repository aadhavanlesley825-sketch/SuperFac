import React from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="max-w-[600px] mx-auto text-center py-32">
      <Radio size={28} className="text-amber-700 mx-auto mb-4" />
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Signal lost</h1>
      <p className="text-sm text-slate-600 mb-6">This page isn't on the network — nothing's monitoring it.</p>
      <Link to="/overview" className="text-sm text-amber-700 hover:underline">Back to Command Center</Link>
    </div>
  );
}
