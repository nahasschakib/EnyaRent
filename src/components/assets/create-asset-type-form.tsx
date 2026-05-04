"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTORS = [
  { value: "REAL_ESTATE", label: "Immobilier" },
  { value: "VEHICLE", label: "Véhicules" },
  { value: "HOSPITALITY", label: "Hôtellerie" },
  { value: "EQUIPMENT", label: "Équipements" },
];

const inputClass = (hasError: boolean) =>
  cn(
    "w-full h-10 px-3 border rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-600 transition-colors",
    hasError ? "border-red-500" : "border-slate-200 dark:border-slate-700"
  );

interface Props {
  onSuccess: (type: { id: string; name: string }) => void;
}

export function CreateAssetTypeForm({ onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [sector, setSector] = useState("REAL_ESTATE");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/asset-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sector }),
      });
      if (!res.ok) throw new Error("Échec de la création");
      return res.json();
    },
    onSuccess: async (type) => {
      toast.success(`Type "${type.name}" créé`);
      await queryClient.invalidateQueries({ queryKey: ["asset-types"] });
      onSuccess(type);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du type (ex: Appartement)"
        className={inputClass(false)}
        autoFocus
      />
      <select
        value={sector}
        onChange={(e) => setSector(e.target.value)}
        className={cn(inputClass(false), "cursor-pointer")}
      >
        {SECTORS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!name.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="w-full h-9 text-sm font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {mutation.isPending ? "Création..." : "Créer ce type"}
      </button>
    </div>
  );
}
