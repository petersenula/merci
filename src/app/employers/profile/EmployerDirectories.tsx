'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmployerQRModal from "./EmployerQRModal";
import { getPublicAppUrl } from "@/lib/publicUrl";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from "@/lib/translation";

type Scheme = {
  id: string;
  name: string;
  description?: string | null;
  active_from?: string | null;
  active_to?: string | null;
};

type DirectoryItem = {
  id: string;
  scheme_id: string;
  position: number;
  scheme?: Scheme | Scheme[] | null;
};

type Directory = {
  id: string;
  employer_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: DirectoryItem[];
};

type Props = {
  schemes: Scheme[];
};

function getSchemeFromItem(item: DirectoryItem): Scheme | null {
  if (Array.isArray(item.scheme)) {
    return item.scheme[0] ?? null;
  }

  return item.scheme ?? null;
}

export default function EmployerDirectories({ schemes }: Props) {
  const { t } = useT();
  const supabase = getSupabaseBrowserClient();

  const [directories, setDirectories] = useState<Directory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSchemeIds, setNewSchemeIds] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSchemeIds, setEditSchemeIds] = useState<string[]>([]);
  const [editActive, setEditActive] = useState(true);

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function authenticatedFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);

    if (init.body) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(input, {
      ...init,
      headers,
    });
  }

  async function loadDirectories() {
    try {
      setLoading(true);
      setError(null);

      const res = await authenticatedFetch("/api/employers/directories");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("qr_lists_error_load"));
      }

      setDirectories(data.directories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("qr_lists_error_load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDirectories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleScheme(
    schemeId: string,
    selected: string[],
    setSelected: (value: string[]) => void
  ) {
    if (selected.includes(schemeId)) {
      setSelected(selected.filter((id) => id !== schemeId));
    } else {
      setSelected([...selected, schemeId]);
    }
  }

  function resetCreate() {
    setCreating(false);
    setNewName("");
    setNewDescription("");
    setNewSchemeIds([]);
  }

  async function createDirectory() {
    const name = newName.trim();

    if (!name) {
      setError(t("qr_lists_error_name_required"));
      return;
    }

    if (newSchemeIds.length === 0) {
      setError(t("qr_lists_error_scheme_required"));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);

      const res = await authenticatedFetch("/api/employers/directories", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: newDescription,
          scheme_ids: newSchemeIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("qr_lists_error_create"));
      }

      resetCreate();
      await loadDirectories();
      setNotice(t("qr_lists_created"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("qr_lists_error_create"));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(directory: Directory) {
    setEditingId(directory.id);
    setEditName(directory.name);
    setEditDescription(directory.description ?? "");
    setEditActive(directory.is_active);
    setEditSchemeIds(directory.items.map((item) => item.scheme_id));
    setError(null);
    setNotice(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditSchemeIds([]);
    setEditActive(true);
  }

  async function saveDirectory(directoryId: string) {
    const name = editName.trim();

    if (!name) {
      setError(t("qr_lists_error_name_required"));
      return;
    }

    if (editSchemeIds.length === 0) {
      setError(t("qr_lists_error_scheme_required"));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);

      const res = await authenticatedFetch("/api/employers/directories", {
        method: "PUT",
        body: JSON.stringify({
          directory_id: directoryId,
          name,
          description: editDescription,
          is_active: editActive,
          scheme_ids: editSchemeIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("qr_lists_error_update"));
      }

      cancelEdit();
      await loadDirectories();
      setNotice(t("qr_lists_updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("qr_lists_error_update"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteDirectory(directory: Directory) {
    const confirmed = window.confirm(
      t("qr_lists_delete_confirm").replace("{name}", directory.name)
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setNotice(null);

      const res = await authenticatedFetch("/api/employers/directories", {
        method: "DELETE",
        body: JSON.stringify({
          directory_id: directory.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("qr_lists_error_delete"));
      }

      if (editingId === directory.id) {
        cancelEdit();
      }

      await loadDirectories();
      setNotice(t("qr_lists_deleted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("qr_lists_error_delete"));
    } finally {
      setSaving(false);
    }
  }

  function openQr(directoryId: string) {
    setQrUrl(`${getPublicAppUrl()}/g/${directoryId}`);
  }

  function SchemeSelector({
    selected,
    onChange,
  }: {
    selected: string[];
    onChange: (value: string[]) => void;
  }) {
    if (schemes.length === 0) {
      return (
        <p className="text-sm text-slate-500">
          {t("qr_lists_create_scheme_first")}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {schemes.map((scheme) => (
          <label
            key={scheme.id}
            className="flex items-center gap-3 border rounded-lg p-3 bg-white cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(scheme.id)}
              onChange={() =>
                toggleScheme(scheme.id, selected, onChange)
              }
            />

            <div className="min-w-0">
              <div className="font-medium text-slate-900">
                {scheme.name}
              </div>

              {scheme.description && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {scheme.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10 pt-8 border-t">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">{t("qr_lists_title")}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {t("qr_lists_description")}
          </p>
        </div>

        {!creating && (
          <Button
            variant="green"
            type="button"
            disabled={schemes.length === 0}
            onClick={() => {
              setCreating(true);
              setError(null);
              setNotice(null);
            }}
          >
            {t("qr_lists_create")}
          </Button>
        )}
      </div>

      {notice && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-300 text-green-800 text-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm">
          {error}
        </div>
      )}

      {qrUrl && (
        <EmployerQRModal
          url={qrUrl}
          onClose={() => setQrUrl(null)}
          title={t("qr_lists_qr_title")}
        />
      )}

      {creating && (
        <div className="border rounded-lg p-4 bg-slate-50 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("qr_lists_name")}
            </label>
            <Input
              value={newName}
              placeholder={t("qr_lists_name_placeholder")}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("qr_lists_description_optional")}
            </label>
            <Input
              value={newDescription}
              placeholder={t("qr_lists_description_placeholder")}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-2">
              {t("qr_lists_schemes_after_scan")}
            </div>
            <SchemeSelector
              selected={newSchemeIds}
              onChange={setNewSchemeIds}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="green"
              type="button"
              disabled={saving || !newName.trim() || newSchemeIds.length === 0}
              onClick={createDirectory}
            >
              {saving ? t("qr_lists_creating") : t("qr_lists_create")}
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={saving}
              onClick={resetCreate}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">{t("qr_lists_loading")}</p>
      ) : directories.length === 0 ? (
        <p className="text-sm text-slate-500">
          {t("qr_lists_empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {directories.map((directory) => {
            const editing = editingId === directory.id;

            return (
              <div
                key={directory.id}
                className="border rounded-lg p-4 bg-white"
              >
                {!editing ? (
                  <>
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {directory.name}
                          </h3>

                          {!directory.is_active && (
                            <span className="text-xs text-orange-700">
                              {t("qr_lists_inactive")}
                            </span>
                          )}
                        </div>

                        {directory.description && (
                          <p className="text-sm text-slate-600 mt-1">
                            {directory.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => startEdit(directory)}
                        >
                          {t("edit")}
                        </Button>

                        <Button
                          variant="orange"
                          type="button"
                          onClick={() => openQr(directory.id)}
                        >
                          {t("qr_lists_generate_qr")}
                        </Button>

                        <Button
                          variant="outline"
                          type="button"
                          disabled={saving}
                          onClick={() => deleteDirectory(directory)}
                        >
                          {t("qr_lists_delete")}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        {t("qr_lists_included_schemes")}
                      </div>

                      <ul className="space-y-1">
                        {directory.items.map((item) => {
                          const scheme = getSchemeFromItem(item);

                          return (
                            <li
                              key={item.id}
                              className="text-sm text-slate-800"
                            >
                              {scheme?.name ?? t("qr_lists_scheme_not_found")}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("qr_lists_name")}
                      </label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("qr_lists_description_optional")}
                      </label>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">
                        {t("qr_lists_schemes")}
                      </div>
                      <SchemeSelector
                        selected={editSchemeIds}
                        onChange={setEditSchemeIds}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                      />
                      {t("qr_lists_active")}
                    </label>

                    <p className="text-xs text-slate-500">
                      {t("qr_lists_edit_qr_unchanged")}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="green"
                        type="button"
                        disabled={
                          saving ||
                          !editName.trim() ||
                          editSchemeIds.length === 0
                        }
                        onClick={() => saveDirectory(directory.id)}
                      >
                        {saving ? t("qr_lists_saving") : t("qr_lists_save_changes")}
                      </Button>

                      <Button
                        variant="outline"
                        type="button"
                        disabled={saving}
                        onClick={cancelEdit}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
