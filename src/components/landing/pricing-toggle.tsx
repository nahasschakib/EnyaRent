"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export type Plan = {
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  period: string;
  description: string;
  cta: string;
  href: string;
  featured: boolean;
  features: string[];
};

export function PricingToggle({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span
          className={`text-sm transition-colors ${
            !annual ? "font-semibold text-slate-900" : "text-slate-400"
          }`}
        >
          Mensuel
        </span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors duration-150 ${
            annual ? "bg-primary-600" : "bg-slate-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
              annual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm transition-colors ${
            annual ? "font-semibold text-slate-900" : "text-slate-400"
          }`}
        >
          Annuel{" "}
          <span className="ml-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            -20%
          </span>
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-8 rounded-2xl border bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] ${
              plan.featured ? "border-2 border-primary-600" : "border-slate-200"
            }`}
            style={
              plan.featured
                ? { background: "linear-gradient(160deg, #fff 55%, #FFF7ED 100%)" }
                : undefined
            }
          >
            {plan.featured && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-600 text-white text-[11px] font-semibold whitespace-nowrap">
                Recommandé
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-slate-500 mb-5">{plan.description}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[38px] font-bold text-slate-900 tabular-nums">
                  {annual ? plan.priceAnnual : plan.priceMonthly}
                </span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
            </div>

            <ul className="flex flex-col gap-2.5 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check size={14} className="mt-0.5 shrink-0 text-primary-600" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium transition-colors ${
                plan.featured
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {plan.cta}
              {plan.featured && <ArrowRight size={14} />}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
