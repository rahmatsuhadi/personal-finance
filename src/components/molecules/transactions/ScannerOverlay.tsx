import { useEffect, useRef, useState } from "react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { Camera, X, RefreshCw, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAiConfig, scanReceiptWithBackend } from "@/lib/aiConfig";

// Kompres canvas image source (frame video / img) ke JPEG terkompresi
function compressImageSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension = 1280,
  quality = 0.7
): string {
  // ponytail: kalkulasi rasio aspek proporsional; naikkan maxDimension jika teks nota mikro buram
  let width = sourceWidth;
  let height = sourceHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal menginisialisasi context canvas.");

  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

// Baca file gambar dari galeri lalu kompres ke base64 JPEG
function compressImageFile(file: File): Promise<string> {
  // ponytail: pembacaan gambar native web; gunakan createImageBitmap jika memindahkan ke web worker
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const compressed = compressImageSource(img, img.naturalWidth, img.naturalHeight);
          resolve(compressed);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membuka file."));
    reader.readAsDataURL(file);
  });
}

interface ScannerOverlayProps {
  onClose: () => void;
  onResult: (data: any) => void;
  localCategories: string;
}

export function ScannerOverlay({ onClose, onResult, localCategories }: ScannerOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // ── Start Camera ──
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setHasError(true);
        toast.error("Gagal mengakses kamera. Pastikan izin diberikan.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Eksekusi pemindaian gambar terkompresi ke backend AI
  async function processScan(base64Image: string) {
    const aiConfig = getAiConfig();
    if (!aiConfig.enabled || !aiConfig.apiKey.trim()) {
      toast.error("Fitur scanner dinonaktifkan. Aktifkan dan isi API Key di Pengaturan.");
      return;
    }

    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const result = await scanReceiptWithBackend({
        image: base64Image,
        categories: localCategories,
        date: today,
      });

      if (result.success && result.data) {
        onResult(result.data);
        toast.success("Nota berhasil dipindai!");
      } else {
        throw new Error(result.error || "Gagal menganalisis nota.");
      }
    } catch (err) {
      console.error("Scanning error:", err);
      const errorMessage = err instanceof Error ? err.message : "Gagal menganalisis nota. Coba lagi.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setIsCapturing(false);
    }
  }

  // Tangani penangkapan frame video kamera
  async function handleCapture() {
    if (!stream || !videoRef.current || isProcessing) return;

    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 150);

    try {
      const video = videoRef.current;
      const base64Image = compressImageSource(
        video,
        video.videoWidth || 1280,
        video.videoHeight || 720
      );
      await processScan(base64Image);
    } catch (err) {
      console.error("Capture compression error:", err);
      toast.error("Gagal memproses gambar kamera.");
      setIsCapturing(false);
    }
  }

  // Tangani upload gambar nota dari berkas galeri
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressedImage = await compressImageFile(file);
      await processScan(compressedImage);
    } catch (err) {
      console.error("Upload compression error:", err);
      toast.error("Gagal mengompres gambar yang diunggah.");
      setIsProcessing(false);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-brutal-black flex flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 z-10 bg-brutal-black border-b-4 border-white">
        <span className="text-white font-black uppercase tracking-wider text-sm">Pindai Nota Struk</span>
        <button
          onClick={onClose}
          className="h-10 w-10 flex items-center justify-center border-2 border-white bg-brutal-black text-white brutal-press shadow-[2px_2px_0px_#fff]"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Camera Viewfinder ── */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        {hasError ? (
          <div className="text-center px-8">
            <div className="inline-flex p-4 border-2 border-white bg-brutal-rose mb-4">
              <Camera size={32} className="text-white" />
            </div>
            <p className="text-white font-black uppercase tracking-wider text-sm">
              Kamera Tidak Tersedia
            </p>
            <BrutalButton
              variant="accent"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </BrutalButton>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Guide Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-10">
              <div className="w-full aspect-[3/4] border-4 border-brutal-lime relative shadow-[0_0_20px_rgba(200,241,53,0.2)]">
                {/* Corners */}
                <div className="absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 border-white" />
                <div className="absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 border-white" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 border-white" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 border-white" />
              </div>
            </div>

            {/* Flash Effect Overlay */}
            <div className={cn(
              "absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none",
              isCapturing ? "opacity-100" : "opacity-0"
            )} />

            {/* Processing Overlay (Solid Black - No Video Bleeding) */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                <RefreshCw size={48} className="text-brutal-lime animate-spin mb-4" strokeWidth={3} />
                <p className="text-white font-black uppercase tracking-[0.2em] text-sm animate-pulse">
                  Menganalisis...
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      <div className="px-6 py-8 bg-brutal-black border-t-4 border-white flex flex-col items-center gap-6">
        <p className="text-white/80 text-xs font-black uppercase tracking-widest text-center">
          Posisikan Nota di bingkai atau unggah foto
        </p>

        <div className="flex items-center gap-6">
          {/* Tombol Unggah Galeri */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            title="Unggah dari Galeri"
            className="h-14 w-14 rounded-full border-2 border-white bg-brutal-black flex items-center justify-center text-white brutal-press shadow-[2px_2px_0px_#fff] disabled:opacity-50"
          >
            <ImageIcon size={24} strokeWidth={2.5} />
          </button>

          {/* Tombol Shutter Kamera */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={isProcessing || hasError}
            className={cn(
              "h-20 w-20 rounded-full border-4 border-white flex items-center justify-center p-1",
              "transition-transform active:scale-95 disabled:opacity-50"
            )}
          >
            <div className="w-full h-full rounded-full bg-brutal-lime border-4 border-brutal-black flex items-center justify-center shadow-[4px_4px_0px_#fff]">
              <Camera size={32} strokeWidth={2.5} className="text-brutal-black" />
            </div>
          </button>

          {/* Penyeimbang tata letak */}
          <div className="w-14" />
        </div>
      </div>
    </div>
  );
}
