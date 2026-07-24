"use client";

import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { X, Camera, AlertCircle, Upload, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AddressValidator } from "@/services/transaction/addressValidator";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (address: string, amount?: string, symbol?: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage("");
    setHasCameraPermission(null);
    setScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API (getUserMedia) not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("[QrScanner] Camera access error:", err);
      setHasCameraPermission(false);
      setScanning(false);
      setErrorMessage(
        err.message || "Camera permission denied or unavailable. You can upload an image or enter address manually."
      );
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleDetectedCode(code.data);
          return;
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(tick);
  };

  const handleDetectedCode = (data: string) => {
    stopCamera();
    const parsed = AddressValidator.parseEip681(data);
    toast.success("QR Code scanned successfully!");
    onScanSuccess(parsed.address, parsed.amount, parsed.symbol);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          handleDetectedCode(code.data);
        } else {
          toast.error("No valid QR code found in uploaded image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const parsed = AddressValidator.parseEip681(manualInput.trim());
    onScanSuccess(parsed.address, parsed.amount, parsed.symbol);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[26px] border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-foreground">QR Scanner</h3>
              <p className="text-[11px] text-muted-foreground">Scan wallet address or EIP-681 URI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-card-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="relative aspect-[4/3] w-full rounded-[20px] bg-black overflow-hidden border border-border/80 flex items-center justify-center">
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${hasCameraPermission ? "block" : "hidden"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Targeting Overlay */}
          {hasCameraPermission && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-48 h-48 border-2 border-primary/80 rounded-2xl relative animate-pulse flex items-center justify-center">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                <div className="w-full h-0.5 bg-primary/50 absolute top-1/2 -translate-y-1/2 animate-bounce" />
              </div>
            </div>
          )}

          {/* Loading or Permission States */}
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 text-center p-6 space-y-2">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <div className="text-[13px] font-bold text-foreground">Requesting Camera Access...</div>
              <p className="text-[11px] text-muted-foreground">Please allow camera permissions in your browser.</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/95 text-center p-6 space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <div className="text-[13px] font-bold text-foreground">Camera Unavailable</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Alternative Actions: Upload QR Image or Paste URI */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] border border-border bg-card-secondary hover:bg-accent/10 transition text-[12px] font-bold text-foreground cursor-pointer">
              <Upload className="h-4 w-4 text-primary" />
              <span>Upload QR Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {hasCameraPermission === false && (
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[14px] bg-primary/10 text-primary hover:bg-primary/20 transition text-[12px] font-bold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Camera</span>
              </button>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste EIP-681 URI or 0x address..."
                className="flex-1 rounded-[14px] border border-border/80 bg-card-secondary px-3 py-2 text-[12px] font-mono text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-[14px] bg-primary text-white text-[12px] font-bold shadow-sm hover:bg-primary/90 transition"
              >
                Use
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
