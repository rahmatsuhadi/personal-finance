import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useOnboardingForm() {
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
    } catch {
      setError("Gagal menyimpan nama. Coba lagi.");
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
  }

  return {
    name,
    setName,
    isLoading,
    error,
    setError,
    handleSave,
    handleKeyDown,
  };
}
