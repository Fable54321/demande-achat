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
const MAX_PURCHASE_DOCUMENTS = 5
const MAX_PURCHASE_DOCUMENT_SIZE_MB = 7
const MAX_PURCHASE_DOCUMENT_SIZE_BYTES =
  MAX_PURCHASE_DOCUMENT_SIZE_MB * 1024 * 1024

const ACCEPTED_PURCHASE_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]

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
  const [finalSupplier, setFinalSupplier] = useState("")
  const [purchaseDocuments, setPurchaseDocuments] = useState<File[]>([])

  const { id, token } = useParams<{ id: string; token: string }>()

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

  const handlePurchaseDocumentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (!selectedFiles.length) return

    const remainingSlots = MAX_PURCHASE_DOCUMENTS - purchaseDocuments.length

    if (remainingSlots <= 0) {
      event.target.value = ""
      return
    }

    const validFiles = selectedFiles.filter((file) => {
      return (
        ACCEPTED_PURCHASE_DOCUMENT_TYPES.includes(file.type) &&
        file.size <= MAX_PURCHASE_DOCUMENT_SIZE_BYTES
      )
    })

    if (validFiles.length !== selectedFiles.length) {
      setSubmitError(
        `Certains fichiers ont ete ignores. Formats acceptes: JPG, PNG, WEBP ou PDF. Maximum ${MAX_PURCHASE_DOCUMENT_SIZE_MB} MB par fichier.`,
      )
    }

    setPurchaseDocuments((currentFiles) =>
      [...currentFiles, ...validFiles.slice(0, remainingSlots)].slice(
        0,
        MAX_PURCHASE_DOCUMENTS,
      ),
    )

    event.target.value = ""
  }

  const removePurchaseDocument = (indexToRemove: number) => {
    setPurchaseDocuments((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!selectedPurchaseRequest || !id || !token) return

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
    const formData = new FormData()

    formData.append("final_unit_price", String(safeFinalUnitPrice))
    formData.append("purchased_by_user_id", "1")

    if (finalSupplier.trim()) {
      formData.append("final_supplier", stripUnsafeText(finalSupplier, 120).trim())
    }

    if (safePurchaseReference) {
      formData.append("purchase_reference", safePurchaseReference)
    }

    if (safePurchaseNote) {
      formData.append("purchase_note", safePurchaseNote)
    }

    purchaseDocuments.forEach((file) => {
      formData.append("purchase_documents", file)
    })

    const updatedRequest = await markPurchaseRequestAsPurchased(
      Number(id),
      token,
      formData,
    )

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
                      Quantité
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

              <div className="grid gap-4 tablet:grid-cols-3">
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

                <label className="flex flex-col gap-2 text-base font-bold text-slate-700">
  Fournisseur final
  <input
    type="text"
    value={finalSupplier}
    onChange={(event) =>
      setFinalSupplier(stripUnsafeText(event.target.value, 120))
    }
    maxLength={120}
    placeholder={
      selectedPurchaseRequest.final_supplier ||
      selectedPurchaseRequest.buyer_confirmed_supplier ||
      selectedPurchaseRequest.requested_supplier ||
      "Fournisseur utilisé pour l'achat"
    }
    className="h-13 min-h-13 rounded-lg border border-secondary/20 bg-white px-3 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
  />
</label>

                <div className="rounded-lg border border-secondary/15 bg-tertiary/70 px-4 py-3 text-base leading-7 text-slate-700 tablet:col-span-2">
                  <span className="font-bold text-secondary">Total final: </span>
                  {finalTotal !== null ? formatCurrency(finalTotal) : "A calculer"}
                </div>

                <div className="flex flex-col gap-3 tablet:col-span-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-secondary/30 bg-tertiary/50 px-4 py-5 text-center transition hover:border-secondary hover:bg-primary/10">
                    <ReceiptText
                      className="mb-2 text-secondary"
                      size={28}
                      aria-hidden="true"
                    />

                    <span className="text-base font-bold text-secondary">
                      Ajouter une facture, un recu ou une confirmation
                    </span>

                    <span className="mt-1 text-sm text-slate-500">
                      {purchaseDocuments.length}/{MAX_PURCHASE_DOCUMENTS} fichier(s) - JPG,
                      PNG, WEBP ou PDF - Maximum {MAX_PURCHASE_DOCUMENT_SIZE_MB} MB
                    </span>

                    <input
                      type="file"
                      accept={ACCEPTED_PURCHASE_DOCUMENT_TYPES.join(",")}
                      multiple
                      className="hidden"
                      disabled={purchaseDocuments.length >= MAX_PURCHASE_DOCUMENTS}
                      onChange={handlePurchaseDocumentChange}
                    />
                  </label>

                  {purchaseDocuments.length > 0 && (
                    <div className="grid gap-2">
                      {purchaseDocuments.map((file, index) => (
                        <div
                          key={`${file.name}-${file.lastModified}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-secondary/15 bg-white px-3 py-2 text-base shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-700">
                              {file.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removePurchaseDocument(index)}
                            className="rounded-md px-3 py-1 text-sm font-bold text-red-700 transition hover:bg-red-50"
                          >
                            Retirer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
