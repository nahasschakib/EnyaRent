"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  cin: z.string().optional(),
  passportNumber: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "COMPANY"]),
  guarantorName: z.string().optional(),
  guarantorCin: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorAddress: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const [withGuarantor, setWithGuarantor] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "INDIVIDUAL" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload: any = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        cin: data.cin || undefined,
        passportNumber: data.passportNumber || undefined,
        address: data.address || undefined,
        type: data.type,
      };

      if (withGuarantor && data.guarantorName) {
        payload.guarantor = {
          name: data.guarantorName,
          cin: data.guarantorCin,
          phone: data.guarantorPhone,
          address: data.guarantorAddress,
        };
      }

      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      return res.json();
    },
    onSuccess: (customer) => {
      toast.success("Client cree avec succes");
      router.push(`/dashboard/customers/${customer.id}`);
    },
    onError: () => {
      toast.error("Erreur lors de la creation du client");
    },
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-10 px-3 border rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-600 transition-colors",
      hasError ? "border-red-500" : "border-slate-200 dark:border-slate-700"
    );

  return (
    <div>
      <PageHeader
        title="Nouveau client"
        breadcrumb={["EnyaRent", "Clients", "Nouveau"]}
      />

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Identite */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Identite</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder="Ex: Mohamed Alami"
                  className={inputClass(!!errors.name)}
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Type</label>
                <select
                  {...register("type")}
                  className={cn(inputClass(false), "cursor-pointer")}
                >
                  <option value="INDIVIDUAL">Particulier</option>
                  <option value="COMPANY">Entreprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">CIN</label>
                <input
                  {...register("cin")}
                  placeholder="Ex: AB123456"
                  className={inputClass(false)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Passeport</label>
                <input
                  {...register("passportNumber")}
                  placeholder="Ex: P1234567"
                  className={inputClass(false)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Telephone</label>
                <input
                  {...register("phone")}
                  placeholder="Ex: +212 6XX XXX XXX"
                  className={inputClass(false)}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Ex: client@exemple.ma"
                  className={inputClass(!!errors.email)}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Adresse</label>
                <input
                  {...register("address")}
                  placeholder="Adresse complete"
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>

          {/* Garant */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Garant</h2>
              <button
                type="button"
                onClick={() => setWithGuarantor(!withGuarantor)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  withGuarantor ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                    withGuarantor ? "translate-x-4.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {withGuarantor && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Nom du garant</label>
                  <input
                    {...register("guarantorName")}
                    placeholder="Nom complet"
                    className={inputClass(false)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">CIN garant</label>
                  <input {...register("guarantorCin")} placeholder="CIN" className={inputClass(false)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Tel. garant</label>
                  <input {...register("guarantorPhone")} placeholder="Telephone" className={inputClass(false)} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Adresse garant</label>
                  <input {...register("guarantorAddress")} placeholder="Adresse" className={inputClass(false)} />
                </div>
              </div>
            )}
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
              {mutation.isPending ? "Creation..." : "Creer le client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
