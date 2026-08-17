import AssetForm from "@/components/assets/AssetForm";

export const metadata = {
  title: "Nouvel asset — EnyaRent",
};

export default function NewAssetPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 lg:px-8">
      <AssetForm />
    </div>
  );
}