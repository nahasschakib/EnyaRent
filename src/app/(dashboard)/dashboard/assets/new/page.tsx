"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CreateAssetTypeForm } from "@/components/assets/create-asset-type-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

const schema = z.object({
  name:           z.string().min(1, "Le nom est requis"),
  assetTypeId:    z.string().min(1, "Le type est requis"),
  status:         z.string(),
  description:    z.string().optional(),
  pricePerMonth:  z.string().optional(),
  pricePerNight:  z.string().optional(),
  pricePerDay:    z.string().optional(),
  deposit:        z.string().optional(),
  address:        z.string().optional(),
  city:           z.string().optional(),
  // Champs véhicule
  immatriculation: z.string().optional(),
  vin:             z.string().optional(),
  marque:          z.string().optional(),
  modele:          z.string().optional(),
  annee:           z.string().optional(),
  couleur:         z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type AssetType  = { id: string; name: string; sector: string };

export default function NewAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showTypeForm, setShowTypeForm] = useState(false);

  const { data: assetTypes = [], isLoading: typesLoading } = useQuery<AssetType[]>({
    queryKey: ["asset-types"],
    queryFn: async () => {
      const res = await fetch("/api/v1/asset-types");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "AVAILABLE" },
  });

  const selectedTypeId = watch("assetTypeId");
  const selectedType   = assetTypes.find((t) => t.id === selectedTypeId);
  const isVehicle      = selectedType?.sector === "VEHICLE";

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create asset");
      return res.json();
    },
    onSuccess: (asset) => {
      toast.success("Asset créé avec succès");
      router.push(`/dashboard/assets/${asset.id}`);
    },
    onError: () => toast.error("Erreur lors de la création de l'asset"),
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  const inputClass = (hasError = false) =>
    cn(
      "w-full h-10 px-3 border rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-600 transition-colors",
      hasError ? "border-red-500" : "border-slate-200 dark:border-slate-700"
    );

  const assetTypeOptions = assetTypes.map((t) => ({
    value:       t.id,
    label:       t.name,
    description: t.sector?.toLowerCase().replace("_", " "),
  }));

  return (
    <div>
      <PageHeader
        title="Nouvel asset"
        breadcrumb={["EnyaRent", "Assets", "Nouveau"]}
      />

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Informations générales */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Informations générales
            </h2>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                placeholder={isVehicle ? "Ex: Honda Civic 2022" : "Ex: Appartement Hassan II"}
                className={inputClass(!!errors.name)}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Type d'asset <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTypeForm(!showTypeForm)}
                    className="inline-flex items-center gap-1 text-[12px] text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {showTypeForm ? <><X size={12} />Annuler</> : <><Plus size={12} />Nouveau type</>}
                  </button>
                </div>

                {showTypeForm ? (
                  <CreateAssetTypeForm
                    onSuccess={(type) => {
                      queryClient.invalidateQueries({ queryKey: ["asset-types"] });
                      setShowTypeForm(false);
                      toast.success(`Type "${type.name}" créé`);
                    }}
                  />
                ) : (
                  <>
                    <Controller
                      name="assetTypeId"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={assetTypeOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={
                            typesLoading ? "Chargement..." :
                            assetTypes.length === 0 ? "Aucun type — créez-en un" :
                            "Sélectionner un type"
                          }
                          disabled={typesLoading}
                          className={errors.assetTypeId ? "border-red-500" : ""}
                        />
                      )}
                    />
                    {assetTypes.length === 0 && !typesLoading && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Cliquez sur "+ Nouveau type" pour en créer un.
                      </p>
                    )}
                  </>
                )}
                {errors.assetTypeId && !showTypeForm && (
                  <p className="text-xs text-red-600">{errors.assetTypeId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Statut
                </label>
                <select {...register("status")} className={cn(inputClass(), "cursor-pointer")}>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Hors service</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Description de l'asset..."
                className={cn(inputClass(), "h-auto resize-none py-2.5")}
              />
            </div>
          </div>

          {/* Section véhicule — affichée uniquement si sector === VEHICLE */}
          {isVehicle && (
            <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-cyan-900 dark:text-cyan-100">
                Informations véhicule
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Immatriculation
                  </label>
                  <input
                    {...register("immatriculation")}
                    placeholder="Ex: 12345-A-1"
                    className={inputClass()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    N° VIN / Châssis
                  </label>
                  <input
                    {...register("vin")}
                    placeholder="17 caractères"
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Marque
                  </label>
                  <input
                    {...register("marque")}
                    placeholder="Ex: Honda"
                    className={inputClass()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Modèle
                  </label>
                  <input
                    {...register("modele")}
                    placeholder="Ex: Civic"
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Année
                  </label>
                  <input
                    {...register("annee")}
                    placeholder="Ex: 2022"
                    className={inputClass()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Couleur
                  </label>
                  <input
                    {...register("couleur")}
                    placeholder="Ex: Blanc nacré"
                    className={inputClass()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tarification */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tarification (MAD)
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Prix / mois
                </label>
                <input {...register("pricePerMonth")} type="number" step="0.01" placeholder="0.00" className={inputClass()} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Prix / nuit
                </label>
                <input {...register("pricePerNight")} type="number" step="0.01" placeholder="0.00" className={inputClass()} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Prix / jour
                </label>
                <input {...register("pricePerDay")} type="number" step="0.01" placeholder="0.00" className={inputClass()} />
              </div>
            </div>

            <div className="space-y-1.5 max-w-[200px]">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                Caution (dépôt)
              </label>
              <input {...register("deposit")} type="number" step="0.01" placeholder="0.00" className={inputClass()} />
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Localisation
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Ville</label>
                <input {...register("city")} placeholder="Ex: Casablanca" className={inputClass()} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Adresse</label>
                <input {...register("address")} placeholder="Ex: 12 Rue Hassan II" className={inputClass()} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {mutation.isPending ? "Création..." : "Créer l'asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
