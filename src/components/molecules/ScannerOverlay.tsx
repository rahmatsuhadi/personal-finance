import { useEffect, useRef, useState } from "react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { Camera, X, Zap,  RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CONFIG } from "@/config";

interface ScannerOverlayProps {
  onClose: () => void;
  onResult: (data: any) => void;
  localCategories: string;
}

export function ScannerOverlay({ onClose, onResult, localCategories }: ScannerOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

async function handleCapture() {
  if (!stream || !videoRef.current || isProcessing) return;

  setIsCapturing(true);
  setIsProcessing(true);

  // Simulate "Camera Flash" effect
  setTimeout(() => setIsCapturing(false), 150);

  try {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) throw new Error("Canvas not found");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Context not found");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8)
    );

    if (!blob) throw new Error("Failed to capture image");

    const formData = new FormData();
    formData.append("image", blob, "receipt.jpg");
    
    const categoriesArray = localCategories.split(",").map(c => c.trim()).filter(Boolean);
    formData.append("local_categories", JSON.stringify(categoriesArray));

    const response = await fetch(CONFIG.API_URL + "/api/ai/scan", {
      method: "POST",
      body: formData,
      credentials: "include",
    });


    const result = await response.json();
    
    // PERUBAHAN DI SINI:
    // AI sekarang mengembalikan properti 'success' di dalam JSON-nya.
    // Jika success === true, lempar data ke onResult.
    if (result.success) {
      onResult(result.data); // result langsung berisi amount, description, dll.
      toast.success("Nota berhasil dipindai!");
    } else {
      // Jika AI mengembalikan success: false, ambil pesan 'error' spesifik dari AI
      // Contoh: "Gambar terlalu blur" atau "Bukan gambar nota"
      throw new Error(result.error || "Gagal menganalisis nota.");
    }

  } catch (err) {
    console.error("Scanning error:", err);
    // Menampilkan pesan error dinamis dari catch (bisa dari API atau error buatan sendiri)
    const errorMessage = err instanceof Error ? err.message : "Gagal menganalisis nota. Coba lagi.";
    toast.error(errorMessage);
  } finally {
    // Memastikan loading di-reset baik ketika sukses maupun gagal
    setIsProcessing(false);
    setIsCapturing(false);
  }
}

  return (
    <div className="fixed inset-0 z-[100] bg-brutal-black flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-4 z-10 bg-gradient-to-b from-brutal-black to-transparent">
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
              <div className="w-full aspect-[3/4] border-2 border-brutal-lime relative">
                {/* Corners */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-brutal-lime" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-brutal-lime" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-brutal-lime" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-brutal-lime" />

                {/* Scanline Animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="w-full h-1 bg-brutal-lime/50 shadow-[0_0_15px_#c8f135] animate-[scan_3s_infinite_linear]" />
                </div>
              </div>
            </div>

            {/* Flash Effect Overlay */}
            <div className={cn(
              "absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none",
              isCapturing ? "opacity-100" : "opacity-0"
            )} />

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-brutal-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
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
      <div className="px-6 py-10 bg-brutal-black flex flex-col items-center gap-6">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest text-center">
          Posisikan Nota / Struk di dalam bingkai hijau
        </p>

        <div className="flex items-center ">
          {/* <button className="text-white/40 brutal-press">
            <Zap size={24} />
          </button> */}

          <button
            onClick={handleCapture}
            disabled={isProcessing || hasError}
            className={cn(
              "h-20 w-20 rounded-full border-4 border-white flex items-center justify-center p-1",
              "transition-transform active:scale-90 disabled:opacity-50"
            )}
          >
            <div className="w-full h-full rounded-full bg-brutal-lime border-4 border-brutal-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
              <Camera size={32} strokeWidth={2.5} />
            </div>
          </button>

        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(1000%); }
        }
      `}</style>
    </div>
  );
}
