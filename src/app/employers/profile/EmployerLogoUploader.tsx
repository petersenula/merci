'use client';

import { useCallback, useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Upload, X, Camera } from "lucide-react";
import { useT } from "@/lib/translation";

type Props = {
  userId: string;
  initialUrl?: string | null;
  onChange: (url: string | null) => void;
};

export function EmployerLogoUploader({ userId, initialUrl, onChange }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // 🔥 UPLOAD + SAVE
  // =====================================================
  const uploadAndSave = useCallback(
    async (file: File) => {
      setError(null);

      // validate type
      if (!file.type.startsWith("image/")) {
        setError(t("errorType"));
        return;
      }

      // validate size
      if (file.size > 5 * 1024 * 1024) {
        setError(t("errorSize"));
        return;
      }

      try {
        setUploading(true);

        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${userId}/logo.${ext}`;

        // upload to storage
        const { error: uploadError } = await supabase.storage
          .from("employer-logos") // <<< BUCKET ДЛЯ РАБОТОДАТЕЛЕЙ
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error(uploadError);
          setError(t("uploadError"));
          setUploading(false);
          return;
        }

        // public URL
        const { data } = supabase.storage.from("employer-logos").getPublicUrl(filePath);

        const url = `${data.publicUrl}?t=${Date.now()}`;

        // save to employers table
        const { error: dbError } = await supabase
          .from("employers")
          .update({ logo_url: url })
          .eq("user_id", userId);

        if (dbError) {
          console.error(dbError);
          setError(t("unknownError"));
          return;
        }

        setPreviewUrl(url);
        onChange(url);
      } catch (e) {
        console.error(e);
        setError(t("unknownError"));
      } finally {
        setUploading(false);
      }
    },
    [supabase, userId, onChange, t]
  );

  // =====================================================
  // 🔥 DELETE LOGO
  // =====================================================
  const handleDelete = async () => {
    if (!previewUrl) return;

    setUploading(true);

    // delete all possible formats
    const folder = `${userId}`;
    await supabase.storage.from("employer-logos").remove([
      `${folder}/logo.jpg`,
      `${folder}/logo.png`,
      `${folder}/logo.jpeg`,
      `${folder}/logo.webp`,
    ]);

    // clear DB field
    await supabase.from("employers").update({ logo_url: null }).eq("user_id", userId);

    setPreviewUrl(null);
    onChange(null);
    setUploading(false);
  };

  useEffect(() => {
    setPreviewUrl(initialUrl ?? null);
  }, [initialUrl]);

  // =====================================================
  // 🔥 UI
  // =====================================================
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("employer.logoUploader")}</label>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-slate-500">{t("noPhoto")}</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">

          {/* Drag & Drop */}
          <label
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) uploadAndSave(file);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border border-dashed rounded-lg p-3 text-xs cursor-pointer flex items-center gap-2 ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <Upload className="w-4 h-4" />
            {t("dragHere")} <span className="underline">{t("chooseFile")}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAndSave(e.target.files[0])}
            />
          </label>

          {/* Take photo */}
          <label className="border border-dashed rounded-lg p-3 text-xs cursor-pointer flex items-center gap-2">
            <Camera className="w-4 h-4" />
            {t("takePhoto")}
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAndSave(e.target.files[0])}
            />
          </label>

          <p className="text-xs text-slate-500">{t("recommendation")}</p>

          {previewUrl && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 text-xs text-red-600"
            >
              <X className="w-3 h-3" />
              {t("delete")}
            </button>
          )}

          {uploading && <p className="text-xs text-slate-500">{t("uploading")}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
