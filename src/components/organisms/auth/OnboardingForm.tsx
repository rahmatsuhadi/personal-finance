import { ArrowRight } from "lucide-react";
import { BrutalInput, BrutalButton } from "@/components/atoms";

export interface OnboardingFormProps {
  name: string;
  onChangeName: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

export function OnboardingForm({
  name,
  onChangeName,
  onKeyDown,
  onSubmit,
  isLoading,
  error,
}: OnboardingFormProps) {
  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div>
        <p className="text-xl font-black uppercase tracking-tight mb-1">
          Hei, Siapa Namamu?
        </p>
        <p className="text-sm text-brutal-black/60 font-medium">
          Masukkan nama panggilanmu untuk memulai tanpa akun.
        </p>
      </div>

      <BrutalInput
        id="onboarding-name"
        label="Nama Panggilan"
        placeholder="cth. Budi, Sari, Alex..."
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyDown={onKeyDown}
        error={error}
        autoFocus
        maxLength={30}
      />

      <BrutalButton
        id="onboarding-submit"
        variant="accent"
        size="lg"
        fullWidth
        onClick={onSubmit}
        disabled={isLoading}
      >
        <span className="flex items-center gap-2 justify-center">
          {isLoading ? "Menyimpan..." : "Mulai Lacak Keuangan"}
          {!isLoading && <ArrowRight size={16} strokeWidth={2.5} />}
        </span>
      </BrutalButton>

      <p className="text-center text-[11px] font-medium text-brutal-black/50">
        Data disimpan secara lokal di perangkatmu.
        <br />
        Login dengan Google untuk sinkronisasi antar perangkat.
      </p>
    </div>
  );
}
