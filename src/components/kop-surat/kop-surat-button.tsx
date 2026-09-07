"use client";

import { useState } from "react";
import { Settings, Building2 } from "lucide-react";
import { KopSuratModal } from "./kop-surat-modal";
import type { InstitutionProfile } from "@/types";

interface KopSuratButtonProps {
  initialProfile?: InstitutionProfile | null;
  className?: string;
  variant?: "header" | "badge" | "card";
}

export function KopSuratButton({
  initialProfile,
  className = "",
  variant = "header",
}: KopSuratButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<InstitutionProfile | null>(initialProfile || null);

  if (variant === "badge") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors ${className}`}
          title="Buka Pengaturan Lembaga & Format Penomoran"
        >
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>Atur Penomoran</span>
        </button>

        <KopSuratModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialProfile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${className}`}
        title="Pengaturan Identitas Lembaga, Logo, dan Format Penomoran Akun"
      >
        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Pengaturan Akun &amp; Kop</span>
      </button>

      <KopSuratModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialProfile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />
    </>
  );
}
