import { LogOut } from "lucide-react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { cn } from "@/lib/utils";

export interface ProfileCardProps {
  name: string;
  onLogout: () => void;
  className?: string;
}

export function ProfileCard({ name, onLogout, className }: ProfileCardProps) {
  return (
    <div className={cn("p-4", className)}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
        Profil Pengguna
      </p>
      <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-yellow shadow-brutal-sm">
            <span className="text-2xl font-black">
              {name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Nama</p>
            <p className="text-xl font-black truncate">{name}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t-2 border-brutal-black">
          <BrutalButton
            variant="danger"
            size="sm"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut size={14} strokeWidth={2.5} />
            Logout / Reset Profil
          </BrutalButton>
        </div>
      </div>
    </div>
  );
}
