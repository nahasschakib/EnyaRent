"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import {
  Globe, Eye, EyeOff, CheckCircle2, Loader2, ExternalLink, Copy,
  Upload, X, ImageIcon,
} from "lucide-react";

type OrgSettings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  plan: string;
};

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

async function uploadImage(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/v1/upload/image", { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Échec de l'upload");
  }
  const { url } = await res.json();
  return url;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState<{ logo?: boolean; cover?: boolean }>({});
  const [uploadError, setUploadError] = useState<{ logo?: string; cover?: string }>({});

  const { data: org, isLoading } = useQuery<OrgSettings>({
    queryKey: ["org-settings"],
    queryFn: () => fetch("/api/v1/organizations/settings").then((r) => r.json()),
  });

  const [form, setForm] = useState<Partial<OrgSettings>>({});

  useEffect(() => {
    if (org) setForm(org);
  }, [org]);

  const mutation = useMutation({
    mutationFn: (data: Partial<OrgSettings>) =>
      fetch("/api/v1/organizations/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) {
          const json = await r.json();
          throw new Error(json.error ?? "Erreur lors de la sauvegarde");
        }
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-settings"] });
      setSaved(true);
      setSlugError("");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: Error) => {
      if (err.message.includes("slug")) setSlugError(err.message);
    },
  });

  function set(key: keyof OrgSettings, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo" | "cover"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((p) => ({ ...p, [field]: true }));
    setUploadError((p) => ({ ...p, [field]: undefined }));
    try {
      const url = await uploadImage(file, field === "logo" ? "logos" : "covers");
      set(field === "logo" ? "logoUrl" : "coverUrl", url);
    } catch (err) {
      setUploadError((p) => ({
        ...p,
        [field]: err instanceof Error ? err.message : "Erreur upload",
      }));
    } finally {
      setUploading((p) => ({ ...p, [field]: false }));
      e.target.value = "";
    }
  }

  function handleSlugChange(value: string) {
    const normalized = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    set("slug", normalized);
    setSlugError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://enyarent.ma/agencies/${form.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Paramètres" breadcrumb={["EnyaRent", "Paramètres"]} />
        <div className="p-8">
          <div className="max-w-2xl space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Paramètres"
        breadcrumb={["EnyaRent", "Paramètres"]}
        actions={
          saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={15} />
              Sauvegardé
            </span>
          ) : undefined
        }
      />

      <div className="p-8">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

          {/* General */}
          <section className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                Informations générales
              </h2>
              <p className="text-sm text-slate-500">Nom et description de votre organisation.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nom de l&apos;agence
              </label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nom de votre agence"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Décrivez votre agence en quelques mots..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </section>

          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Public storefront */}
          <section className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5 flex items-center gap-2">
                <Globe size={16} className="text-primary-600" />
                Vitrine publique
              </h2>
              <p className="text-sm text-slate-500">
                Personnalisez l&apos;URL de votre agence et gérez sa visibilité.
              </p>
            </div>

            {/* isPublic toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                {form.isPublic ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Eye size={15} className="text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <EyeOff size={15} className="text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Agence publique
                  </p>
                  <p className="text-xs text-slate-500">
                    {form.isPublic
                      ? "Votre agence est visible dans l'annuaire"
                      : "Votre agence est masquée du public"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set("isPublic", !form.isPublic)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    form.isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Slug public
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-0 flex-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                  <span className="px-3 py-2.5 text-sm text-slate-400 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shrink-0 select-none">
                    /agencies/
                  </span>
                  <input
                    type="text"
                    value={form.slug ?? ""}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="mon-agence"
                    className="flex-1 h-10 px-3 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
              {slugError && (
                <p className="text-xs text-red-600 mt-1">{slugError}</p>
              )}
              {!slugError && (
                <p className="text-xs text-slate-400 mt-1">
                  Uniquement lettres minuscules, chiffres et tirets.
                </p>
              )}
            </div>

            {/* Preview link */}
            {form.slug && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-widest font-medium">
                    Lien public
                  </p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-mono">
                    enyarent.ma/agencies/{form.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    title="Copier le lien"
                  >
                    <Copy size={13} />
                    {copied ? "Copié !" : "Copier"}
                  </button>
                  <a
                    href={`/agencies/${form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <ExternalLink size={13} />
                    Prévisualiser
                  </a>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Branding */}
          <section className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                Branding
              </h2>
              <p className="text-sm text-slate-500">
                Logo et bannière affichés sur votre vitrine publique.
              </p>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Logo
              </label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <ImageIcon size={20} className="text-slate-300" />
                  )}
                </div>
                {/* Controls */}
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                    {uploading.logo ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploading.logo ? "Upload…" : "Choisir un fichier"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading.logo}
                      onChange={(e) => handleFileUpload(e, "logo")}
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG ou WebP · max 5 Mo</p>
                  {uploadError.logo && (
                    <p className="text-[11px] text-red-600 mt-1">{uploadError.logo}</p>
                  )}
                  {form.logoUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="url"
                        value={form.logoUrl}
                        onChange={(e) => set("logoUrl", e.target.value)}
                        className="flex-1 h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-[11px] text-slate-500 font-mono focus:outline-none"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => set("logoUrl", "")}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cover upload */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bannière (cover)
              </label>
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden">
                {form.coverUrl ? (
                  <div className="relative h-32">
                    <img
                      src={form.coverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg bg-white/90 text-xs font-medium text-slate-800 hover:bg-white transition-colors">
                        {uploading.cover ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        Remplacer
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploading.cover}
                          onChange={(e) => handleFileUpload(e, "cover")}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => set("coverUrl", "")}
                        className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {uploading.cover ? (
                      <Loader2 size={20} className="text-slate-400 animate-spin mb-2" />
                    ) : (
                      <Upload size={20} className="text-slate-300 mb-2" />
                    )}
                    <span className="text-xs font-medium text-slate-500">
                      {uploading.cover ? "Upload en cours…" : "Cliquer pour uploader une bannière"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">1200×400px recommandé · max 5 Mo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading.cover}
                      onChange={(e) => handleFileUpload(e, "cover")}
                    />
                  </label>
                )}
              </div>
              {uploadError.cover && (
                <p className="text-[11px] text-red-600 mt-1">{uploadError.cover}</p>
              )}
            </div>
          </section>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                "Sauvegarder"
              )}
            </button>
            {mutation.error && !slugError && (
              <span className="text-xs text-red-600">
                {(mutation.error as Error).message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
