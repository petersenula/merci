'use client';

import { useCallback, useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Upload, X, Camera } from 'lucide-react';
import { useT } from "@/lib/translation";

type Props = {
  userId: string;
  initialUrl?: string | null;
  onChange: (url: string | null) => void;
};

export function AvatarUploader({ userId, initialUrl, onChange }: Props) {
  // ✅ ВАЖНО: типизируем supabase клиент
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialUrl ?? null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAndSave = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError(t("errorType"));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(t("errorSize"));
        return;
      }

      try {
        setUploading(true);

        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${userId}/avatar.${ext}`;

        // upload file
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error(uploadError);
          setError(t("uploadError"));
          return;
        }

        // get new URL with cache-busting
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const url = `${publicUrl}?t=${Date.now()}`;

        // ✅ save URL to DB — ТЕПЕРЬ БЕЗ ОШИБКИ
        const { error: dbError } = await supabase
          .from('profiles_earner')
          .update({ avatar_url: url })
          .eq('id', userId);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAndSave(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAndSave(file);
  };

  const handleDelete = async () => {
    if (!previewUrl) return;

    setUploading(true);

    const folderPath = `${userId}`;
    await supabase.storage
      .from("avatars")
      .remove([
        `${folderPath}/avatar.jpg`,
        `${folderPath}/avatar.png`,
        `${folderPath}/avatar.jpeg`,
      ]);

    // ✅ update DB — null тоже теперь валиден
    await supabase
      .from('profiles_earner')
      .update({ avatar_url: null })
      .eq('id', userId);

    setPreviewUrl(null);
    onChange(null);
    setUploading(false);
  };

  useEffect(() => {
    setPreviewUrl(initialUrl ?? null);
  }, [initialUrl]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("title")}</label>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-slate-500">{t("noPhoto")}</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <label
            onDrop={handleDrop}
           onDragOver={(e: React.DragEvent<HTMLElement>) => {
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
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>

          <label className="border border-dashed rounded-lg p-3 text-xs cursor-pointer flex items-center gap-2">
            <Camera className="w-4 h-4" />
            {t("takePhoto")}
            <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect}/>
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
