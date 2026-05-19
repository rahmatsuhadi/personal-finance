import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { Wallet, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Feature Pill Component ───────────────────────────────────────────────────

function FeaturePill({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Wallet;
  label: string;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-2 border-brutal-black px-3 py-2",
        "shadow-brutal-sm",
        color
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── OnboardingScreen ─────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const { saveName } = useAuth();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await saveName(trimmed);
      // useAuth will reactively update → AppNavigator switches to MainApp
    } catch (e) {
      setError("Gagal menyimpan nama. Coba lagi.");
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
  }

  return (
    <div className="flex h-dvh flex-col bg-brutal-bg overflow-y-auto">
      {/* Hero Block */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* App Logo / Brand Mark */}
        <div className="mb-10 flex flex-col items-center gap-3">
          {/* <div
            className={cn(
              "flex h-20 w-20 items-center justify-center",
              "border-4 border-brutal-black bg-brutal-lime shadow-brutal-xl"
            )}
          >
            <Wallet size={40} strokeWidth={2.5} />
          </div> */}
          <img src="/logo.png" alt="Kanti Arta Logo" className="h-20 w-auto" />
          <div className="text-center">
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
              Kanti Arta
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-60 mt-1">
              Pelacak Keuangan Pribadi
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <FeaturePill icon={Wallet} label="Multi Dompet" color="bg-brutal-cyan" />
          <FeaturePill icon={TrendingUp} label="Statistik" color="bg-brutal-yellow" />
          <FeaturePill icon={ShieldCheck} label="Data Lokal" color="bg-brutal-lime" />
        </div>

        {/* Divider */}
        <div className="w-full border-t-4 border-brutal-black mb-8" />

        {/* Input Section */}
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <p className="text-xl font-black uppercase tracking-tight mb-1">
              Hei, Siapa Namamu?
            </p>
            <p className="text-sm text-brutal-black/60 font-medium">
              Masukkan nama panggilanmu untuk memulai.
            </p>
          </div>

          <BrutalInput
            id="onboarding-name"
            label="Nama Panggilan"
            placeholder="cth. Budi, Sari, Alex..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            error={error}
            autoFocus
            maxLength={30}
          />

          <BrutalButton
            id="onboarding-submit"
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Mulai Lacak Keuangan →"}
          </BrutalButton>

          <p className="text-center text-[11px] font-medium text-brutal-black/50">
            Data disimpan secara lokal di perangkatmu.
            <br />
            Tidak ada akun, tidak ada server.
          </p>
        </div>
      </div>

      {/* Bottom decoration stripe */}
      <div className="flex h-3 border-t-2 border-brutal-black">
        <div className="flex-1 bg-brutal-lime" />
        <div className="flex-1 bg-brutal-cyan" />
        <div className="flex-1 bg-brutal-yellow" />
        <div className="flex-1 bg-brutal-pink" />
        <div className="flex-1 bg-brutal-purple" />
      </div>
    </div>
  );
}
