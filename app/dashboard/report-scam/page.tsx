"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Upload, X, CheckCircle2, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 900;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportScamPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shopUrl, setShopUrl]     = useState("");
  const [content, setContent]     = useState("");
  const [images, setImages]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 3 - images.length;
    if (remaining <= 0) return;
    setImgLoading(true);
    setError(null);
    try {
      const toProcess = Array.from(files).slice(0, remaining);
      const compressed = await Promise.all(toProcess.map(compressImage));
      setImages(prev => [...prev, ...compressed]);
    } catch {
      setError("Failed to process image. Please try another file.");
    } finally {
      setImgLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!shopUrl.trim()) { setError("Please enter the store URL."); return; }
    if (content.trim().length < 30) { setError("Description must be at least 30 characters."); return; }
    if (images.length === 0) { setError("Please upload at least 1 evidence screenshot."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/scam-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopUrl: shopUrl.trim(), content: content.trim(), images }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to submit."); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="px-4 py-8 sm:px-8 sm:py-12 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-10 text-center"
          style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)" }}>
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report submitted!</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Our team will review your report. If approved, this store will be added to the blacklist
            and other users will be warned when checking it.
          </p>
          <button onClick={() => router.push("/dashboard")}
            className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Back to dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Report a Scam Store</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Help protect other shoppers. Reports are reviewed by our team before being added to the blacklist.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Shop URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Store URL *
          </label>
          <input
            type="text"
            placeholder="e.g. https://fakeshop.com or fakeshop.com"
            value={shopUrl}
            onChange={e => setShopUrl(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            What happened? *
            <span className="ml-2 normal-case font-normal text-gray-600">(min 30 characters)</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe how you were scammed — e.g. paid but never received item, fake product, refused refund..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <p className="mt-1 text-xs text-gray-600">{content.length} / 30 minimum</p>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Evidence screenshots *
            <span className="ml-2 normal-case font-normal text-gray-600">(up to 3 images)</span>
          </label>

          {images.length < 3 && (
            <button type="button"
              onClick={() => fileRef.current?.click()}
              disabled={imgLoading}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-6 text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
              style={{ border: "1px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
              {imgLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Upload className="h-5 w-5" />}
              <span>{imgLoading ? "Processing…" : "Click to upload image"}</span>
              <span className="text-xs text-gray-700">JPG, PNG, WEBP · Max 5MB each</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {images.map((src, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-video"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`evidence ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button"
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.7)" }}>
                    <X className="h-3 w-3 text-white" />
                  </button>
                  <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded px-1.5 py-0.5"
                    style={{ background: "rgba(0,0,0,0.6)" }}>
                    <ImageIcon className="h-2.5 w-2.5 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <>
            <AlertTriangle className="h-4 w-4" />Submit report for review
          </>}
        </button>

        <p className="text-center text-xs text-gray-700">
          False reports may result in account suspension. Only submit genuine scam experiences.
        </p>
      </form>
    </div>
  );
}
