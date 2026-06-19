import type { PurchaseMode } from "../../../Contexts/BuyingContext"

type Props = {
  purchaseMode: PurchaseMode
  onChange: (mode: PurchaseMode) => void
}

const PurchaseModeSelector = ({ purchaseMode, onChange }: Props) => {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Type d'achat
      </h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("full")}
          className={`rounded-xl border p-4 text-left ${
            purchaseMode === "full"
              ? "border-[#4B7312] bg-tertiary"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="font-semibold text-slate-900">Achat complet</p>
          <p className="mt-1 text-sm text-slate-600">
            Toute la demande est achetée en une seule étape.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange("partial")}
          className={`rounded-xl border p-4 text-left ${
            purchaseMode === "partial"
              ? "border-[#4B7312] bg-tertiary"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="font-semibold text-slate-900">Achat partiel</p>
          <p className="mt-1 text-sm text-slate-600">
            Créez un ou plusieurs bons d'achat selon les fournisseurs.
          </p>
        </button>
      </div>
    </section>
  )
}

export default PurchaseModeSelector