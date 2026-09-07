'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmployerQRModal from "./EmployerQRModal";
import { getPublicAppUrl } from "@/lib/publicUrl";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

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
        throw new Error(data?.error || "Failed to load QR lists");
      }

      setDirectories(data.directories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load QR lists");
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
      setError("Please enter a name for the QR list.");
      return;
    }

    if (newSchemeIds.length === 0) {
      setError("Please select at least one scheme.");
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
        throw new Error(data?.error || "Failed to create QR list");
      }

      resetCreate();
      await loadDirectories();
      setNotice("QR list created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create QR list");
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
      setError("Please enter a name for the QR list.");
      return;
    }

    if (editSchemeIds.length === 0) {
      setError("Please select at least one scheme.");
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
        throw new Error(data?.error || "Failed to update QR list");
      }

      cancelEdit();
      await loadDirectories();
      setNotice("QR list updated. The QR code stays the same.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update QR list");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDirectory(directory: Directory) {
    const confirmed = window.confirm(
      `Delete "${directory.name}"? Its QR code will stop working.`
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
        throw new Error(data?.error || "Failed to delete QR list");
      }

      if (editingId === directory.id) {
        cancelEdit();
      }

      await loadDirectories();
      setNotice("QR list deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete QR list");
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
          Create at least one allocation scheme first.
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
          <h2 className="text-lg font-semibold">QR lists</h2>
          <p className="text-sm text-slate-600 mt-1">
            Put several tipping schemes behind one permanent QR code.
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
            Create QR list
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
          title="QR list"
        />
      )}

      {creating && (
        <div className="border rounded-lg p-4 bg-slate-50 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              List name
            </label>
            <Input
              value={newName}
              placeholder="e.g. Zürich Oerlikon – Delivery"
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <Input
              value={newDescription}
              placeholder="e.g. Choose the team you would like to tip"
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-2">
              Schemes shown after scanning this QR
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
              {saving ? "Creating..." : "Create QR list"}
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={saving}
              onClick={resetCreate}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading QR lists...</p>
      ) : directories.length === 0 ? (
        <p className="text-sm text-slate-500">
          No QR lists yet.
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
                              Inactive
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
                          Edit
                        </Button>

                        <Button
                          variant="orange"
                          type="button"
                          onClick={() => openQr(directory.id)}
                        >
                          Generate QR
                        </Button>

                        <Button
                          variant="outline"
                          type="button"
                          disabled={saving}
                          onClick={() => deleteDirectory(directory)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        Included schemes
                      </div>

                      <ul className="space-y-1">
                        {directory.items.map((item) => {
                          const scheme = getSchemeFromItem(item);

                          return (
                            <li
                              key={item.id}
                              className="text-sm text-slate-800"
                            >
                              {scheme?.name ?? "Scheme not found"}
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
                        List name
                      </label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description (optional)
                      </label>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">
                        Schemes
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
                      QR list is active
                    </label>

                    <p className="text-xs text-slate-500">
                      Editing this list does not change its QR code.
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
                        {saving ? "Saving..." : "Save changes"}
                      </Button>

                      <Button
                        variant="outline"
                        type="button"
                        disabled={saving}
                        onClick={cancelEdit}
                      >
                        Cancel
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
