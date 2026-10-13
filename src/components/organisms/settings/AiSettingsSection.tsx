import { useState, useEffect } from "react";
import { Sparkles, Eye, EyeOff, KeyRound, Check, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { getAiConfig, saveAiConfig } from "@/lib/aiConfig";

export function AiSettingsSection() {
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const config = getAiConfig();
    setApiKey(config.apiKey);
    setEnabled(config.enabled);
  }, []);

  function handleToggleEnabled() {
    const nextState = !enabled;
    setEnabled(nextState);
    saveAiConfig({ apiKey, enabled: nextState });
    toast.success(nextState ? "Integrasi AI diaktifkan!" : "Integrasi AI dimatikan (mode offline).");
  }

  function handleSave() {
    saveAiConfig({ apiKey, enabled });
    toast.success("Konfigurasi API Key berhasil disimpan!");
  }

  return (
    <div className="p-4 bg-brutal-bg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">
          Integrasi Backend AI
        </p>
        <div className="flex items-center gap-1 text-[10px] font-black uppercase bg-brutal-purple text-white px-2 py-0.5 border border-brutal-black">
          <Sparkles size={11} strokeWidth={2.5} />
          Chat & Scanner
        </div>
      </div>

      <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-md space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-3 border-2 border-brutal-black bg-brutal-bg">
          <div className="flex items-center gap-2">
            {enabled ? (
              <ShieldCheck size={18} className="text-brutal-lime" strokeWidth={2.5} />
            ) : (
              <ShieldOff size={18} className="text-brutal-rose" strokeWidth={2.5} />
            )}
            <div>
              <p className="text-xs font-black uppercase text-brutal-black">
                Status Integrasi AI
              </p>
              <p className="text-[10px] text-brutal-black/60">
                {enabled ? "Aktif (Full AI Chat & Scanner)" : "Nonaktif (Fitur scanner disembunyikan & chat terbatas)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`w-12 h-6 flex items-center border-2 border-brutal-black p-0.5 transition-colors ${
              enabled ? "bg-brutal-lime justify-end" : "bg-neutral-300 justify-start"
            }`}
            aria-label="Toggle AI Status"
          >
            <div className="w-4 h-4 bg-brutal-black" />
          </button>
        </div>

        {/* API Key */}
        <div>
          <label className="text-xs font-black uppercase flex items-center gap-1.5 mb-1 text-brutal-black">
            <KeyRound size={13} strokeWidth={2.5} />
            Backend API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              placeholder="Masukkan API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full border-2 border-brutal-black py-2 pl-2 pr-9 text-xs font-mono font-bold outline-none focus:bg-brutal-yellow/10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 text-brutal-black/60 hover:text-brutal-black"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[10px] text-brutal-black/50 mt-1">
            Kunci akses untuk mengamankan komunikasi dengan server backend Persona Finance.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t-2 border-brutal-black flex justify-end">
          <BrutalButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="flex items-center gap-1.5"
          >
            <Check size={14} strokeWidth={2.5} />
            Simpan Pengaturan
          </BrutalButton>
        </div>
      </div>
    </div>
  );
}
