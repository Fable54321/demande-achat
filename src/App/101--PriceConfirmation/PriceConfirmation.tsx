import {
  CheckCircle2,
  DollarSign,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
} from "lucide-react"
import { useState } from "react"

const hardcodedRequest = {
  requestedBy: "Jean Tremblay",
  description:
    "Ceci est un exemple de description de produit. La vraie description sera chargee avec l'identifiant de la demande plus tard.",
  quantity: 2,
  unitPrice: 1000,
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value)

const PriceConfirmation = () => {
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const totalPrice = hardcodedRequest.quantity * hardcodedRequest.unitPrice

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitSuccess(true)
  }

  return (
    <section className="w-full px-4 pb-10 pt-6 tablet:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-secondary/15 bg-white shadow-2xl shadow-secondary/10"
      >
        <div className="relative overflow-hidden border-b border-secondary/15 bg-[#eef4e8] px-5 py-5 shadow-[inset_0_-1px_0_rgba(75,115,18,0.08)] tablet:px-8">
          <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/25">
                <ShoppingBag size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Validation acheteur
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Confirmation de prix
                </h2>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Verifiez simplement que le prix demande semble raisonnable.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5 py-6 tablet:px-8">
          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>Le prix demande a ete confirme.</span>
            </div>
          )}

          <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
                <PackageCheck size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900">Demande a verifier</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {hardcodedRequest.description}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm tablet:grid-cols-4">
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="flex items-center gap-2 font-bold text-secondary">
                  <User size={16} aria-hidden="true" />
                  Demandeur
                </dt>
                <dd className="mt-1 text-slate-700">
                  {hardcodedRequest.requestedBy}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="font-bold text-secondary">Quantite</dt>
                <dd className="mt-1 text-slate-700">
                  {hardcodedRequest.quantity}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="flex items-center gap-2 font-bold text-secondary">
                  <DollarSign size={16} aria-hidden="true" />
                  Prix unitaire
                </dt>
                <dd className="mt-1 text-slate-700">
                  {formatCurrency(hardcodedRequest.unitPrice)}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="font-bold text-secondary">Total demande</dt>
                <dd className="mt-1 text-slate-700">
                  {formatCurrency(totalPrice)}
                </dd>
              </div>
            </dl>
          </div>

          <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-secondary/15 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:border-secondary/35 hover:bg-primary/10">
            <input
              className="filter-checkbox-input"
              type="checkbox"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              required
            />
            <span
              className={`filter-checkbox-visual ${
                hasConfirmed
                  ? "filter-checkbox-visual--checked"
                  : "filter-checkbox-visual--unchecked"
              }`}
              aria-hidden="true"
            >
              <svg
                className="filter-checkbox-check"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M5 12.5 9.5 17 19 7" />
              </svg>
            </span>
            <span className="leading-6">
              Je confirme que le prix demande semble raisonnable pour le produit
              decrit.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-8">
          <p className="text-sm text-slate-500">
            La confirmation d'achat finale sera faite plus tard.
          </p>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-6 text-sm font-black text-white shadow-lg shadow-secondary/20 transition hover:cursor-pointer hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            <Send size={18} aria-hidden="true" />
            Confirmer le prix
          </button>
        </div>
      </form>
    </section>
  )
}

export default PriceConfirmation
