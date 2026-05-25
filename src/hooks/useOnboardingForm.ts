import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useOnboardingForm() {
  const { saveName, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
    } catch (e) {
      setError("Gagal menyimpan nama. Coba lagi.");
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError("Login Google gagal. Coba lagi.");
      setIsGoogleLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
  }

  return {
    name,
    setName,
    isLoading,
    isGoogleLoading,
    error,
    setError,
    handleSave,
    handleGoogleLogin,
    handleKeyDown,
  };
}
