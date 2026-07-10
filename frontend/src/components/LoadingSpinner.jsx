import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ size = 24, className = "", text = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 size={size} className="animate-spin text-primary-600" />
      {text && <span className="text-slate-500 font-medium">{text}</span>}
    </div>
  );
}
