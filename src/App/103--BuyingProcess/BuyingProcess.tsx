import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Hash,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  User,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import { MAX_PRICE } from "../100-Form/Utils/formConstants"
import { isValidPrice, sanitizePrice, stripUnsafeText } from "../100-Form/Utils/sanitizers"

const MAX_PURCHASE_REFERENCE_LENGTH = 120
const MAX_PURCHASE_NOTE_LENGTH = 600

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value)

const BuyingProcess = () => {
  const [finalUnitPrice, setFinalUnitPrice] = useState("")
  const [purchaseReference, setPurchaseReference] = useState("")
  const [purchaseNote, setPurchaseNote] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { id } = useParams<{ id: string; token: string }>()

  const {
    fetchPurchaseRequestById,
    selectedPurchaseRequest,
    markPurchaseRequestAsPurchased,
    loading,
  } = usePurchaseRequests()

  useEffect(() => {
    if (!id) return

    fetchPurchaseRequestById(Number(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const suggestedFinalUnitPrice =
    selectedPurchaseRequest?.final_unit_price ??
    selectedPurchaseRequest?.buyer_confirmed_unit_price ??
    selectedPurchaseRequest?.requested_unit_price ??
    null

  const effectiveFinalUnitPrice =
    finalUnitPrice.trim() === ""
      ? suggestedFinalUnitPrice
      : Number(finalUnitPrice)

  const finalTotal = useMemo(() => {
    if (!selectedPurchaseRequest || effectiveFinalUnitPrice === null) return null

    const unitPrice = Number(effectiveFinalUnitPrice)

    if (!Number.isFinite(unitPrice)) return null

    return unitPrice * selectedPurchaseRequest.quantity
  }, [effectiveFinalUnitPrice, selectedPurchaseRequest])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!selectedPurchaseRequest || !id) return

    const safeFinalUnitPrice =
      finalUnitPrice.trim() === ""
        ? suggestedFinalUnitPrice
        : Number(sanitizePrice(finalUnitPrice))
    const safePurchaseReference = stripUnsafeText(
      purchaseReference,
      MAX_PURCHASE_REFERENCE_LENGTH,
    ).trim()
    const safePurchaseNote = stripUnsafeText(
      purchaseNote,
      MAX_PURCHASE_NOTE_LENGTH,
    ).trim()

    if (safeFinalUnitPrice === null || !isValidPrice(safeFinalUnitPrice)) {
      setSubmitError("Le prix final doit etre un montant valide.")
      return
    }

    const updatedRequest = await markPurchaseRequestAsPurchased(Number(id), {
      purchased_by_user_id: 1,
      final_unit_price: safeFinalUnitPrice,
      purchase_reference: safePurchaseReference || null,
      purchase_note: safePurchaseNote || null,
    })

    if (updatedRequest) {
      setSubmitSuccess(true)
    }
  }

  return (
    <section className="relative w-full px-4 pb-10 pt-6 tablet:px-8">
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
                  Achat final
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Confirmation d'achat
                </h2>
              </div>
            </div>
            <p className="max-w-sm text-base leading-7 text-slate-600">
              Confirmez les informations finales après avoir trouvé et acheté le produit.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5 py-6 tablet:px-8">
          {submitError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>L'achat a ete confirme avec succes.</span>
            </div>
          )}

          {selectedPurchaseRequest && (
            <>
              <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
                    <PackageCheck size={22} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className="text-lg font-bold text-black">
                      Demande achetée
                    </p>
                    {selectedPurchaseRequest.description && (
                      <p className="ml-2 mt-1 text-base leading-7 text-slate-900">
                        <span className="font-bold">Produit:</span>
                        <br />
                        {selectedPurchaseRequest.description}
                      </p>
                    )}
                    {selectedPurchaseRequest.reason && (
                      <p className="ml-2 mt-1 text-base leading-7 text-slate-900">
                        <span className="font-bold">Justification:</span>
                        <br />
                        {selectedPurchaseRequest.reason}
                      </p>
                    )}
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-base tablet:grid-cols-4">
                  <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                    <dt className="flex items-center gap-2 font-bold text-secondary">
                      <User size={16} aria-hidden="true" />
                      Demandeur
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {selectedPurchaseRequest.requested_by}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                    <dt className="flex items-center gap-2 font-bold text-secondary">
                      <Hash size={16} aria-hidden="true" />
                      Quantite
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {selectedPurchaseRequest.quantity}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                    <dt className="flex items-center gap-2 font-bold text-secondary">
                      <DollarSign size={16} aria-hidden="true" />
                      Prix confirmé
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {selectedPurchaseRequest.buyer_confirmed_unit_price
                        ? formatCurrency(selectedPurchaseRequest.buyer_confirmed_unit_price)
                        : "Non precise"}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                    <dt className="font-bold text-secondary">Fournisseur</dt>
                    <dd className="mt-1 text-slate-700">
                      {selectedPurchaseRequest.buyer_confirmed_supplier ||
                        selectedPurchaseRequest.requested_supplier ||
                        "Non precise"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-4 tablet:grid-cols-2">
                <label className="flex flex-col gap-2 text-base font-bold text-slate-700">
                  Prix unitaire final
                  <input
                    type="number"
                    min="0"
                    max={MAX_PRICE}
                    step="0.01"
                    inputMode="decimal"
                    value={finalUnitPrice}
                    onChange={(event) => {
                      setFinalUnitPrice(sanitizePrice(event.target.value))
                      setSubmitError(null)
                    }}
                    placeholder={
                      suggestedFinalUnitPrice
                        ? String(suggestedFinalUnitPrice)
                        : "Ex: 25.00"
                    }
                    className="h-13 min-h-13 rounded-lg border border-secondary/20 bg-white px-3 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2 text-base font-bold text-slate-700">
                  Réference d'achat
                  <input
                    type="text"
                    value={purchaseReference}
                    onChange={(event) =>
                      setPurchaseReference(
                        stripUnsafeText(
                          event.target.value,
                          MAX_PURCHASE_REFERENCE_LENGTH,
                        ),
                      )
                    }
                    maxLength={MAX_PURCHASE_REFERENCE_LENGTH}
                    placeholder={
                      selectedPurchaseRequest.purchase_reference ||
                      "Numéro de facture, commande ou reçu"
                    }
                    className="h-13 min-h-13 rounded-lg border border-secondary/20 bg-white px-3 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <div className="rounded-lg border border-secondary/15 bg-tertiary/70 px-4 py-3 text-base leading-7 text-slate-700 tablet:col-span-2">
                  <span className="font-bold text-secondary">Total final: </span>
                  {finalTotal !== null ? formatCurrency(finalTotal) : "A calculer"}
                </div>

                <label className="flex flex-col gap-2 text-base font-bold text-slate-700 tablet:col-span-2">
                  Note d'achat
                  <textarea
                    value={purchaseNote}
                    onChange={(event) =>
                      setPurchaseNote(
                        stripUnsafeText(event.target.value, MAX_PURCHASE_NOTE_LENGTH),
                      )
                    }
                    rows={4}
                    maxLength={MAX_PURCHASE_NOTE_LENGTH}
                    placeholder={
                      selectedPurchaseRequest.purchase_note ||
                      "Détails utiles: fournisseur final, livraison, garantie, emplacement, suivi, etc."
                    }
                    className="min-h-32 resize-y rounded-lg border border-secondary/20 bg-white px-3 py-3 text-base font-semibold leading-7 text-slate-800 shadow-sm outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-secondary focus:ring-4 focus:ring-primary/20"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-8">
          <div className="max-w-md">
            <p className="text-base font-bold text-slate-700">
              Finaliser l'achat
            </p>
            <p className="mt-1 text-base leading-7 text-slate-500">
              Une fois confirmé, la demande sera marquée comme achetée avec les informations finales.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedPurchaseRequest}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-6 font-black text-white shadow-lg shadow-secondary/20 transition hover:cursor-pointer hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <ReceiptText size={18} aria-hidden="true" />
            {loading ? "Enregistrement..." : "Confirmer l'achat"}
          </button>
        </div>
      </form>
    </section>
  )
}

export default BuyingProcess
