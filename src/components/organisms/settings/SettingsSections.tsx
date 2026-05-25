import { Tags, Target, Download, Upload } from "lucide-react";

export interface SettingsSectionProps {
  onCategoriesClick: () => void;
  onBudgetsClick: () => void;
}

export function DataManagementSection({ onCategoriesClick, onBudgetsClick }: SettingsSectionProps) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
        Manajemen Data
      </p>
      <button
        onClick={onCategoriesClick}
        className="w-full border-2 border-brutal-black bg-brutal-white p-4 flex items-center justify-between brutal-press shadow-brutal-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brutal-cyan border-2 border-brutal-black flex items-center justify-center">
            <Tags size={18} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold uppercase">Kelola Kategori</p>
            <p className="text-xs text-brutal-black/60">Ubah, tambah, atau hapus kategori</p>
          </div>
        </div>
      </button>

      <button
        onClick={onBudgetsClick}
        className="w-full border-2 border-brutal-black bg-brutal-white p-4 flex items-center justify-between brutal-press shadow-brutal-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brutal-orange border-2 border-brutal-black flex items-center justify-center">
            <Target size={18} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold uppercase">Atur Anggaran</p>
            <p className="text-xs text-brutal-black/60">Kelola target pengeluaran kategori</p>
          </div>
        </div>
      </button>
    </div>
  );
}

export interface BackupRestoreSectionProps {
  onExport: () => void;
  onImport: () => void;
  isExporting: boolean;
  isImporting: boolean;
}

export function BackupRestoreSection({
  onExport,
  onImport,
  isExporting,
  isImporting,
}: BackupRestoreSectionProps) {
  return (
    <div className="p-4 bg-brutal-bg">
      <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
        Backup & Pemulihan
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="border-2 border-brutal-black bg-brutal-lime p-4 flex flex-col items-center gap-2 brutal-press shadow-brutal-sm disabled:opacity-50"
        >
          <Download size={24} strokeWidth={2.5} />
          <div className="text-center">
            <p className="text-xs font-black uppercase">Ekspor Data</p>
            <p className="text-[10px] opacity-70">Simpan ke JSON</p>
          </div>
        </button>

        <button
          onClick={onImport}
          disabled={isImporting}
          className="border-2 border-brutal-black bg-brutal-yellow p-4 flex flex-col items-center gap-2 brutal-press shadow-brutal-sm disabled:opacity-50"
        >
          <Upload size={24} strokeWidth={2.5} />
          <div className="text-center">
            <p className="text-xs font-black uppercase">Impor Data</p>
            <p className="text-[10px] opacity-70">Muat dari file</p>
          </div>
        </button>
      </div>
    </div>
  );
}
