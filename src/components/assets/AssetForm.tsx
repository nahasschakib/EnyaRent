"use client";

import { useState } from "react";
import { useForm, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";

type Sector = "REAL_ESTATE" | "VEHICLE" | "HOSPITALITY" | "EQUIPMENT";

// Schéma plat — zéro discriminatedUnion, zéro assetTypeId requis
const assetFormSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  city: z.string().min(1, "La ville est requise"),
  address: z.string().optional(),
  description: z.string().optional(),
  deposit: z.string().optional(),
pricePerNight: z.string().optional(),
pricePerDay: z.string().optional(),
pricePerMonth: z.string().optional(),
  // Véhicule
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.string().optional(),
  immatriculation: z.string().optional(),
  vin: z.string().optional(),
  couleur: z.string().optional(),
  // Immobilier
  surface: z.string().optional(),
rooms: z.string().optional(),
floor: z.string().optional(),
  leaseType: z.enum(["1YR", "2YR", "6M", "MONTHLY"]).optional(),
 charges: z.string().optional(),
  dpe: z.string().optional(),
  furnished: z.boolean(),
chargesIncluded: z.boolean(),
  // Véhicule metadata
  fuelType: z.enum(["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]).optional(),
  mileage: z.string().optional(),
extraKmRate: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  vignetteExpiry: z.string().optional(),
  // Hôtellerie
  roomNumber: z.string().optional(),
  roomType: z.enum(["SINGLE", "DOUBLE", "SUITE", "FAMILY"]).optional(),
  capacity: z.string().optional(),
  checkinTime: z.string().optional(),
  checkoutTime: z.string().optional(),
  // Équipement
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR"]).optional(),
 replacementValue: z.string().optional(),
  rateUnit: z.enum(["HOUR", "DAY", "WEEK"]).optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

type FormProps = {
  register: UseFormRegister<AssetFormValues>;
  errors: FieldErrors<AssetFormValues>;
  getToggle: (key: keyof AssetFormValues) => boolean;
  setToggle: (key: keyof AssetFormValues, value: boolean) => void;
};

const SECTORS = [
  { value: "REAL_ESTATE" as Sector, label: "Immobilier", icon: "🏢", description: "Bail résidentiel · Dahir 1994" },
  { value: "VEHICLE" as Sector, label: "Véhicule", icon: "🚗", description: "Location courte durée" },
  { value: "HOSPITALITY" as Sector, label: "Hôtellerie", icon: "🏨", description: "Booking par nuit" },
  { value: "EQUIPMENT" as Sector, label: "Équipement", icon: "🔧", description: "BTP · Audiovisuel · Industriel" },
];

const LEASE_TYPES = [
  { value: "1YR", label: "1 an (renouvelable)" },
  { value: "2YR", label: "2 ans" },
  { value: "6M", label: "6 mois" },
  { value: "MONTHLY", label: "Mensuel" },
];

const FUEL_TYPES = [
  { value: "GASOLINE", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Électrique" },
  { value: "HYBRID", label: "Hybride" },
];

const ROOM_TYPES = [
  { value: "SINGLE", label: "Chambre simple" },
  { value: "DOUBLE", label: "Chambre double" },
  { value: "SUITE", label: "Suite" },
  { value: "FAMILY", label: "Familiale" },
];

const EQUIPMENT_CONDITIONS = [
  { value: "NEW", label: "Neuf" },
  { value: "GOOD", label: "Très bon état" },
  { value: "FAIR", label: "Bon état" },
  { value: "POOR", label: "Correct" },
];

const EQUIPMENT_CATEGORIES = ["BTP / Génie civil", "Audiovisuel", "Informatique", "Médical", "Industriel", "Événementiel", "Autre"];
const DPE_CLASSES = ["A", "B", "C", "D", "E", "F", "G"];
const HOTEL_AMENITIES = [
  { value: "breakfast", label: "Petit-déjeuner" },
  { value: "parking", label: "Parking privé" },
  { value: "airport_transfer", label: "Transfert aéroport" },
  { value: "wifi_premium", label: "Wi-Fi premium" },
  { value: "pool", label: "Piscine" },
  { value: "spa", label: "Spa & bien-être" },
];

function FormField({ label, required, error, helper, children }: {
  label: string; required?: boolean; error?: string; helper?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
        {label}{required && <span className="text-orange-500 text-xs">*</span>}
      </label>
      {children}
      {helper && !error && <p className="text-xs text-slate-400">{helper}</p>}
      {error && <p className="text-xs text-red-500">⚠ {error}</p>}
    </div>
  );
}

function Input({ prefix, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string }) {
  const base = "w-full h-9 border border-slate-200 rounded-md text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all";
  if (prefix) return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono pointer-events-none">{prefix}</span>
      <input className={`${base} pl-12 pr-3 ${className}`} {...props} />
    </div>
  );
  return <input className={`${base} px-3 ${className}`} {...props} />;
}

function SelectField({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="w-full h-9 px-3 pr-8 border border-slate-200 rounded-md text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer" {...props}>
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
      <span className="text-sm text-slate-700">{label}</span>
      <Button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-orange-500" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </Button>
    </div>
  );
}

function SectionTitle({ children, badge, badgeVariant = "slate" }: {
  children: React.ReactNode; badge?: string; badgeVariant?: "orange" | "blue" | "slate";
}) {
  const variants = { orange: "bg-orange-50 text-orange-700 border-orange-200", blue: "bg-blue-50 text-blue-700 border-blue-200", slate: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">{children}</h3>
      {badge && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${variants[badgeVariant]}`}>{badge}</span>}
    </div>
  );
}

function RealEstateFields({ register, errors, getToggle, setToggle }: FormProps) {
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-800 flex items-start gap-2">
        <span>ℹ️</span><span>Ces champs alimentent le contrat de bail conforme au droit marocain (Dahir 1994).</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Surface (m²)" required error={errors.surface?.message}><Input type="number" placeholder="75" {...register("surface")} /></FormField>
        <FormField label="Pièces" required error={errors.rooms?.message}><Input type="number" placeholder="3" {...register("rooms")} /></FormField>
        <FormField label="Étage"><Input type="number" placeholder="2" {...register("floor")} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Type de bail" required error={errors.leaseType?.message}>
          <SelectField {...register("leaseType")}>
            <option value="">Sélectionner...</option>
            {LEASE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectField>
        </FormField>
        <FormField label="Charges mensuelles (MAD)"><Input type="number" prefix="MAD" placeholder="500" {...register("charges")} /></FormField>
        <FormField label="Classe DPE">
          <SelectField {...register("dpe")}>
            <option value="">—</option>
            {DPE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
        </FormField>
      </div>
      <div className="space-y-2">
        <Toggle label="Logement meublé" checked={getToggle("furnished")} onChange={(v) => setToggle("furnished", v)} />
        <Toggle label="Charges comprises dans le loyer" checked={getToggle("chargesIncluded")} onChange={(v) => setToggle("chargesIncluded", v)} />
      </div>
    </div>
  );
}

function VehicleFields({ register, errors }: FormProps) {
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-800 flex items-start gap-2">
        <span>ℹ️</span><span>Ces champs alimentent le contrat location véhicule et le suivi kilométrique automatique.</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Marque" required error={errors.marque?.message}><Input type="text" placeholder="Honda" {...register("marque")} /></FormField>
        <FormField label="Modèle" required error={errors.modele?.message}><Input type="text" placeholder="Civic" {...register("modele")} /></FormField>
        <FormField label="Année" required error={errors.annee?.message}><Input type="number" placeholder="2022" {...register("annee")} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Immatriculation" required error={errors.immatriculation?.message}><Input type="text" placeholder="12345-A-1" {...register("immatriculation")} /></FormField>
        <FormField label="Numéro VIN"><Input type="text" placeholder="WVWZZZ3BZ..." {...register("vin")} /></FormField>
        <FormField label="Couleur"><Input type="text" placeholder="Blanc nacré" {...register("couleur")} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Carburant" required error={errors.fuelType?.message}>
          <SelectField {...register("fuelType")}>
            <option value="">Sélectionner...</option>
            {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </SelectField>
        </FormField>
        <FormField label="Kilométrage actuel" helper="Km de départ pour le 1er contrat"><Input type="number" placeholder="45000" {...register("mileage")} /></FormField>
        <FormField label="Prix km dépassement (MAD)" helper="Par km au-delà du forfait"><Input type="number" prefix="MAD" placeholder="2.50" {...register("extraKmRate")} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Expiration assurance"><Input type="date" {...register("insuranceExpiry")} /></FormField>
        <FormField label="Expiration vignette"><Input type="date" {...register("vignetteExpiry")} /></FormField>
      </div>
    </div>
  );
}

function HospitalityFields({ register, errors }: FormProps) {
  const [amenities, setAmenities] = useState<string[]>([]);
  const toggleAmenity = (v: string) => setAmenities((prev) => prev.includes(v) ? prev.filter((a) => a !== v) : [...prev, v]);
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800 flex items-start gap-2">
        <span>ℹ️</span><span>Ces champs configurent le moteur de booking par nuit et les options proposées aux clients.</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="N° chambre" required error={errors.roomNumber?.message}><Input type="text" placeholder="101" {...register("roomNumber")} /></FormField>
        <FormField label="Étage"><Input type="number" placeholder="1" {...register("floor")} /></FormField>
        <FormField label="Type" required error={errors.roomType?.message}>
          <SelectField {...register("roomType")}>
            <option value="">Sélectionner...</option>
            {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </SelectField>
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Capacité (personnes)" required error={errors.capacity?.message}><Input type="number" placeholder="2" {...register("capacity")} /></FormField>
        <FormField label="Heure check-in"><Input type="text" placeholder="14:00" {...register("checkinTime")} /></FormField>
        <FormField label="Heure check-out"><Input type="text" placeholder="11:00" {...register("checkoutTime")} /></FormField>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">Suppléments proposables</p>
        <div className="grid grid-cols-2 gap-2">
          {HOTEL_AMENITIES.map((a) => (
            <button key={a.value} type="button" onClick={() => toggleAmenity(a.value)}
              className={`flex items-center gap-2 p-2.5 text-sm rounded-md border transition-all text-left ${amenities.includes(a.value) ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${amenities.includes(a.value) ? "border-orange-500 bg-orange-500" : "border-slate-300"}`}>
                {amenities.includes(a.value) && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EquipmentFields({ register, errors }: FormProps) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-800 flex items-start gap-2">
        <span>⚠️</span><span>La caution est <strong>obligatoire</strong> pour les équipements.</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Catégorie" required error={errors.category?.message}>
          <SelectField {...register("category")}>
            <option value="">Sélectionner...</option>
            {EQUIPMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
        </FormField>
        <FormField label="Numéro de série"><Input type="text" placeholder="SN-2024-..." {...register("serialNumber")} /></FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="État initial" required error={errors.condition?.message}>
          <SelectField {...register("condition")}>
            <option value="">Sélectionner...</option>
            {EQUIPMENT_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectField>
        </FormField>
        <FormField label="Valeur de remplacement" required error={errors.replacementValue?.message} helper="Valeur à neuf">
          <Input type="number" prefix="MAD" placeholder="50000" {...register("replacementValue")} />
        </FormField>
        <FormField label="Unité de tarif" required error={errors.rateUnit?.message}>
          <SelectField {...register("rateUnit")}>
            <option value="">Sélectionner...</option>
            <option value="HOUR">Heure</option>
            <option value="DAY">Journée</option>
            <option value="WEEK">Semaine</option>
          </SelectField>
        </FormField>
      </div>
    </div>
  );
}

function PricingSection({ sector, register, errors }: { sector: Sector | null } & Pick<FormProps, "register" | "errors">) {
  if (!sector) return (
    <div className="grid grid-cols-3 gap-3 opacity-40 pointer-events-none">
      {["Prix / nuit", "Prix / jour", "Prix / mois"].map((label) => (
        <FormField key={label} label={label}><Input type="number" placeholder="0" prefix="MAD" disabled /></FormField>
      ))}
    </div>
  );
  if (sector === "REAL_ESTATE") return (
    <FormField label="Loyer mensuel" required error={errors.pricePerMonth?.message}>
      <Input type="number" prefix="MAD" placeholder="5 000" {...register("pricePerMonth")} />
    </FormField>
  );
  if (sector === "VEHICLE") return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Prix / jour" required error={errors.pricePerDay?.message}><Input type="number" prefix="MAD" placeholder="350" {...register("pricePerDay")} /></FormField>
      <FormField label="Prix / semaine" helper="Optionnel"><Input type="number" prefix="MAD" placeholder="2 000" {...register("pricePerMonth")} /></FormField>
    </div>
  );
  if (sector === "HOSPITALITY") return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Prix / nuit" required error={errors.pricePerNight?.message}><Input type="number" prefix="MAD" placeholder="800" {...register("pricePerNight")} /></FormField>
      <FormField label="Prix weekend / nuit" helper="Si différent du standard"><Input type="number" prefix="MAD" placeholder="1 200" {...register("pricePerDay")} /></FormField>
    </div>
  );
  return (
    <div className="grid grid-cols-3 gap-3">
      <FormField label="Prix / heure"><Input type="number" prefix="MAD" placeholder="150" {...register("pricePerNight")} /></FormField>
      <FormField label="Prix / jour" required error={errors.pricePerDay?.message}><Input type="number" prefix="MAD" placeholder="800" {...register("pricePerDay")} /></FormField>
      <FormField label="Prix / semaine"><Input type="number" prefix="MAD" placeholder="4 500" {...register("pricePerMonth")} /></FormField>
    </div>
  );
}

export default function AssetForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<AssetFormValues>({
      resolver: zodResolver(assetFormSchema),
      defaultValues: { furnished: false, chargesIncluded: false },
    });

  const getToggle = (key: keyof AssetFormValues): boolean => {
    const v = watch(key);
    return typeof v === "boolean" ? v : false;
  };
  const setToggle = (key: keyof AssetFormValues, value: boolean) => setValue(key, value);

  const buildMetadata = (data: AssetFormValues, sector: Sector): Record<string, unknown> => {
    if (sector === "REAL_ESTATE") return {
      surface: Number(data.surface ?? 0),
      rooms: Number(data.rooms ?? 0),
      floor: data.floor ? Number(data.floor) : undefined,
      leaseType: data.leaseType,
      charges: data.charges ? Number(data.charges) : undefined,
      dpe: data.dpe,
      furnished: data.furnished,
      chargesIncluded: data.chargesIncluded,
    };
    if (sector === "VEHICLE") return {
      fuelType: data.fuelType,
      mileage: data.mileage ? Number(data.mileage) : undefined,
      extraKmRate: data.extraKmRate ? Number(data.extraKmRate) : undefined,
      insuranceExpiry: data.insuranceExpiry,
      vignetteExpiry: data.vignetteExpiry,
    };
    if (sector === "HOSPITALITY") return {
      roomNumber: data.roomNumber,
      floor: data.floor ? Number(data.floor) : undefined,
      roomType: data.roomType,
      capacity: Number(data.capacity ?? 0),
      checkinTime: data.checkinTime ?? "14:00",
      checkoutTime: data.checkoutTime ?? "11:00",
    };
    return {
      category: data.category,
      serialNumber: data.serialNumber,
      condition: data.condition,
      replacementValue: data.replacementValue ? Number(data.replacementValue) : undefined,
      rateUnit: data.rateUnit,
    };
  };

  const createAsset = useMutation({
    mutationFn: async (data: AssetFormValues) => {
      if (!selectedSector) throw new Error("Secteur requis");
      const res = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, city: data.city, address: data.address, description: data.description,
          deposit: data.deposit ? Number(data.deposit) : undefined,
          pricePerNight: data.pricePerNight ? Number(data.pricePerNight) : undefined,
          pricePerDay: data.pricePerDay ? Number(data.pricePerDay) : undefined,
          pricePerMonth: data.pricePerMonth ? Number(data.pricePerMonth) : undefined,
          sector: selectedSector,
          marque: data.marque, modele: data.modele, annee: data.annee ? Number(data.annee) : undefined, immatriculation: data.immatriculation, vin: data.vin, couleur: data.couleur,
          metadata: buildMetadata(data, selectedSector),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      router.push(`/dashboard/assets/${asset.id}`);
    },
    onError: (err) => {
      console.error("Erreur création asset:", err.message);
    },
  });

  const handleSectorChange = (sector: Sector) => {
    setSelectedSector(sector);
    reset({ furnished: false, chargesIncluded: false });
  };

  const onSubmit = handleSubmit(
    (data) => createAsset.mutate(data),
    (errs) => console.log("Erreurs validation:", JSON.stringify(errs, null, 2))
  );

  const name = watch("name");
  const city = watch("city");
  let completionPct = 10;
  if (selectedSector) completionPct += 30;
  if ((name?.length ?? 0) > 2) completionPct += 30;
  if ((city?.length ?? 0) > 1) completionPct += 30;

  const currentSector = SECTORS.find((s) => s.value === selectedSector);
  const formProps: FormProps = { register, errors, getToggle, setToggle };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
          ← Assets
        </button>
        <span className="text-slate-300">›</span>
        <h1 className="text-xl font-semibold text-slate-900">Nouvel asset</h1>
        <span className="text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">Nouveau</span>
      </div>

      <div className="h-1 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
      </div>

      <p className="text-sm font-medium text-slate-600 mb-3">1. Choisissez le secteur <span className="text-orange-500 text-xs">*</span></p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {SECTORS.map((s) => (
          <button key={s.value} type="button" onClick={() => handleSectorChange(s.value)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 ${selectedSector === s.value ? "border-orange-500 bg-orange-50 shadow-[0_0_0_3px_rgba(234,88,12,0.12)]" : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 hover:shadow-md hover:-translate-y-0.5"}`}>
            {selectedSector === s.value && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
            <span className={`text-2xl flex items-center justify-center w-10 h-10 rounded-lg ${selectedSector === s.value ? "bg-orange-100" : "bg-slate-100"}`}>{s.icon}</span>
            <span className={`text-xs font-medium text-center leading-tight ${selectedSector === s.value ? "text-orange-600" : "text-slate-600"}`}>{s.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
          <div className="p-6">
            <SectionTitle badge="Commun à tous les secteurs">Informations générales</SectionTitle>
            <div className="space-y-4">
              <FormField label="Nom de l'asset" required error={errors.name?.message}>
                <Input type="text" placeholder="Ex: Appartement Maarif T3, Honda Civic 2022..." {...register("name")} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ville" required error={errors.city?.message}>
                  <Input type="text" placeholder="Casablanca, Rabat, Marrakech..." {...register("city")} />
                </FormField>
                <FormField label="Adresse">
                  <Input type="text" placeholder="Rue, quartier, immeuble..." {...register("address")} />
                </FormField>
              </div>
              <FormField label="Description">
                <textarea className="w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-y" placeholder="Décrivez l'asset en quelques phrases..." {...register("description")} />
              </FormField>
            </div>
          </div>

          <div className="p-6">
            {!selectedSector ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-3xl mb-3 opacity-50">🎯</p>
                <p className="text-sm">Sélectionnez un secteur pour voir les champs spécifiques</p>
              </div>
            ) : (
              <>
                <SectionTitle badge={currentSector?.description} badgeVariant={selectedSector === "REAL_ESTATE" || selectedSector === "HOSPITALITY" ? "blue" : "orange"}>
                  {currentSector?.icon} {currentSector?.label}
                </SectionTitle>
                {selectedSector === "REAL_ESTATE" && <RealEstateFields {...formProps} />}
                {selectedSector === "VEHICLE" && <VehicleFields {...formProps} />}
                {selectedSector === "HOSPITALITY" && <HospitalityFields {...formProps} />}
                {selectedSector === "EQUIPMENT" && <EquipmentFields {...formProps} />}
              </>
            )}
          </div>

          <div className="p-6">
            <SectionTitle badge="MAD" badgeVariant="orange">Tarification</SectionTitle>
            <div className="space-y-4">
              <PricingSection sector={selectedSector} register={register} errors={errors} />
              <FormField label="Caution (dépôt de garantie)" helper="Montant versé par le client en garantie, restitué en fin de contrat">
                <Input type="number" prefix="MAD" placeholder="0" {...register("deposit")} />
              </FormField>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
            <button type="button" className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              💾 Sauvegarder brouillon
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => router.back()} className="h-9 px-4 rounded-md text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={!selectedSector || isSubmitting || createAsset.isPending}
                className="flex items-center gap-2 h-9 px-5 rounded-md text-sm font-medium bg-orange-600 text-white shadow-[0_2px_8px_rgba(234,88,12,0.3)] hover:bg-orange-700 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:pointer-events-none">
                {createAsset.isPending ? "⏳ Création en cours..." : "✓ Créer l'asset"}
              </button>
            </div>
          </div>
        </div>

        {createAsset.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            ⚠️ Erreur : {createAsset.error?.message}
          </div>
        )}
      </form>
    </div>
  );
}



