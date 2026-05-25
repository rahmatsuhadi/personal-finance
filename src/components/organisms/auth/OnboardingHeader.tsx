import { Wallet, TrendingUp, ShieldCheck } from "lucide-react";
import { FeaturePill } from "@/components/atoms";

export function OnboardingHeader() {
  return (
    <div className="mb-10 flex flex-col items-center gap-3">
      {/* App Logo / Brand Mark */}
      <img src="/logo.png" alt="Kanti Arta Logo" className="h-20 w-auto" />
      <div className="text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
          Kanti Arta
        </h1>
        <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-60 mt-1">
          Pelacak Keuangan Pribadi
        </p>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        <FeaturePill icon={Wallet} label="Multi Dompet" color="bg-brutal-cyan" />
        <FeaturePill icon={TrendingUp} label="Statistik" color="bg-brutal-yellow" />
        <FeaturePill icon={ShieldCheck} label="Data Lokal" color="bg-brutal-lime" />
      </div>
    </div>
  );
}
