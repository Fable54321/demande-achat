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
import {
  usePurchaseRequests,
  type PurchaseRequestItem,
} from "../../Contexts/PurchaseRequestContext"
import { MAX_PRICE } from "../100-Form/Utils/formConstants"
import {
  isValidPrice,
  sanitizePrice,
  sanitizeQuantity,
  stripUnsafeText,
} from "../100-Form/Utils/sanitizers"
import SuccesOverlay from "../SuccesOverlay"

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

type PurchasedItem = PurchaseRequestItem & {
  final_supplier?: string | null
  final_total_price?: number | null
  final_unit_price?: number | null
  ordered_quantity?: number | null
}

type PurchasedRequestMetadata = {
  final_supplier?: string | null
  purchase_note?: string | null
  purchase_reference?: string | null
}

const BuyingProcess = () => {
  const [finalSupplier, setFinalSupplier] = useState("")
  const [finalUnitPrices, setFinalUnitPrices] = useState<Record<number, string>>(
    {},
  )
  const [orderedQuantities, setOrderedQuantities] = useState<
    Record<number, string>
  >({})
  const [purchaseReference, setPurchaseReference] = useState("")
  const [purchaseNote, setPurchaseNote] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [purchaseDocuments, setPurchaseDocuments] = useState<File[]>([])

  const { id, token } = useParams<{ id: string; token: string }>()

  const {
    error,
    getPurchaseRequestByToken,
    selectedPurchaseRequest,
    markPurchaseRequestAsPurchased,
    loading,
  } = usePurchaseRequests()

  useEffect(() => {
    if (!id || !token) return

    getPurchaseRequestByToken(Number(id), token, "acheter")
  }, [getPurchaseRequestByToken, id, token])

  const requestMetadata =
    selectedPurchaseRequest as
      | (typeof selectedPurchaseRequest & PurchasedRequestMetadata)
      | null

  const purchaseItems = useMemo(
    () => (selectedPurchaseRequest?.items ?? []) as PurchasedItem[],
    [selectedPurchaseRequest?.items],
  )

  const getNumberValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null

    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : null
  }

  const formatOptionalCurrency = (value: unknown) => {
    const numberValue = getNumberValue(value)

    return numberValue === null ? "Non precise" : formatCurrency(numberValue)
  }

  const getItemQuantityLabel = (item: PurchasedItem) => {
    const quantity = item.quantity ?? "Non indiquee"
    const format = item.quantity_format?.trim()

    return format ? `${quantity} ${format}` : String(quantity)
  }

  const getSuggestedFinalUnitPrice = (item: PurchasedItem) =>
    getNumberValue(item.final_unit_price) ??
    getNumberValue(item.buyer_confirmed_unit_price) ??
    getNumberValue(item.requested_unit_price)

  const getEffectiveFinalUnitPrice = (item: PurchasedItem) => {
    const typedValue = finalUnitPrices[item.id]?.trim()

    return typedValue ? getNumberValue(typedValue) : getSuggestedFinalUnitPrice(item)
  }

  const getOrderedQuantity = (item: PurchasedItem) => {
    const typedValue = orderedQuantities[item.id]?.trim()

    return typedValue
      ? getNumberValue(typedValue)
      : getNumberValue(item.ordered_quantity) ?? getNumberValue(item.quantity)
  }

  const getFinalTotalForItem = (item: PurchasedItem) => {
    const finalUnitPrice = getEffectiveFinalUnitPrice(item)
    const orderedQuantity = getOrderedQuantity(item)

    if (finalUnitPrice === null || orderedQuantity === null) {
      return getNumberValue(item.final_total_price)
    }

    return finalUnitPrice * orderedQuantity
  }

  const finalTotal = purchaseItems.reduce((total, item) => {
    const itemTotal = getFinalTotalForItem(item)

    return itemTotal === null ? total : total + itemTotal
  }, 0)

  const suggestedFinalSupplier =
    requestMetadata?.final_supplier ||
    purchaseItems.find((item) => item.final_supplier)?.final_supplier ||
    purchaseItems.find((item) => item.buyer_confirmed_supplier)
      ?.buyer_confirmed_supplier ||
    purchaseItems.find((item) => item.requested_supplier)?.requested_supplier ||
    ""

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

    const safePurchaseReference = stripUnsafeText(
      purchaseReference,
      MAX_PURCHASE_REFERENCE_LENGTH,
    ).trim()
    const safePurchaseNote = stripUnsafeText(
      purchaseNote,
      MAX_PURCHASE_NOTE_LENGTH,
    ).trim()
    const safeFinalSupplier = stripUnsafeText(finalSupplier, 120).trim()

    const safeItems = purchaseItems.map((item) => {
      const typedFinalUnitPrice = finalUnitPrices[item.id]?.trim()
      const typedOrderedQuantity = orderedQuantities[item.id]?.trim()
      const finalUnitPrice = typedFinalUnitPrice
        ? getNumberValue(sanitizePrice(typedFinalUnitPrice))
        : getSuggestedFinalUnitPrice(item)
      const orderedQuantity = typedOrderedQuantity
        ? getNumberValue(sanitizeQuantity(typedOrderedQuantity))
        : getNumberValue(item.ordered_quantity) ?? getNumberValue(item.quantity)

      return {
        id: item.id,
        final_supplier:
          safeFinalSupplier ||
          item.final_supplier ||
          item.buyer_confirmed_supplier ||
          item.requested_supplier ||
          null,
        final_unit_price: finalUnitPrice,
        ordered_quantity: orderedQuantity,
      }
    })

    const invalidItemIndex = safeItems.findIndex(
      (item) =>
        item.final_unit_price === null ||
        !isValidPrice(item.final_unit_price) ||
        item.ordered_quantity === null ||
        item.ordered_quantity <= 0,
    )

    if (invalidItemIndex >= 0) {
      setSubmitError(
        `Article ${invalidItemIndex + 1}: le prix final et la quantite doivent etre valides.`,
      )
      return
    }

    const formData = new FormData()

    formData.append("purchased_by_user_id", "1")
    formData.append("items", JSON.stringify(safeItems))

    if (safeItems.length === 1 && safeItems[0].final_unit_price !== null) {
      formData.append("final_unit_price", String(safeItems[0].final_unit_price))
    }

    if (safeFinalSupplier) {
      formData.append("final_supplier", safeFinalSupplier)
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
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })

      setTimeout(() => {
        setSubmitSuccess(false)
        window.location.replace("https://vegibec-portail.com/")
      }, 4000)
    }
  }

  const name = "Ricardo"
  const successMessage = "les informations d'achats ont bien ete sauvegardees."

  return (
    <section className="relative w-full px-4 pb-10 pt-6 tablet:px-8">
      {submitSuccess && (
        <SuccesOverlay
          successMessage={successMessage}
          onClose={() => setSubmitSuccess(false)}
          name={name}
        />
      )}

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
              Confirmez les informations finales apres avoir trouve et achete le
              produit.
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

          {error && !selectedPurchaseRequest && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
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
                      Demande achetee
                    </p>
                    <p className="text-sm text-slate-700">
                      Demande #{selectedPurchaseRequest.request_reference}
                    </p>
                    <p className="text-sm text-slate-700">
                      {purchaseItems.length} article
                      {purchaseItems.length > 1 ? "s" : ""} a acheter
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-base tablet:grid-cols-3">
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
                      Articles
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {purchaseItems.length}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                    <dt className="flex items-center gap-2 font-bold text-secondary">
                      <DollarSign size={16} aria-hidden="true" />
                      Total final
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {formatCurrency(finalTotal)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-col gap-4">
                  {purchaseItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-secondary/15 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-secondary">
                          Article {item.item_index}
                        </p>
                        <p className="text-slate-900">
                          <span className="font-bold">Produit:</span>
                          <br />
                          {item.description || "Non precise"}
                        </p>
                        {item.reason && (
                          <p className="text-slate-900">
                            <span className="font-bold">Justification:</span>
                            <br />
                            {item.reason}
                          </p>
                        )}
                        <dl className="mt-2 grid gap-3 text-sm tablet:grid-cols-4">
                          <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                            <dt className="font-bold text-secondary">
                              Quantite
                            </dt>
                            <dd className="mt-1 text-slate-700">
                              {getItemQuantityLabel(item)}
                            </dd>
                          </div>
                          <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                            <dt className="font-bold text-secondary">
                              Prix demande
                            </dt>
                            <dd className="mt-1 text-slate-700">
                              {formatOptionalCurrency(item.requested_unit_price)}
                            </dd>
                          </div>
                          <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                            <dt className="font-bold text-secondary">
                              Prix confirme
                            </dt>
                            <dd className="mt-1 text-slate-700">
                              {formatOptionalCurrency(
                                item.buyer_confirmed_unit_price,
                              )}
                            </dd>
                          </div>
                          <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                            <dt className="font-bold text-secondary">
                              Fournisseur
                            </dt>
                            <dd className="mt-1 text-slate-700">
                              {item.final_supplier ||
                                item.buyer_confirmed_supplier ||
                                item.requested_supplier ||
                                "Non precise"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 tablet:grid-cols-3">
                <div className="grid gap-4 tablet:col-span-3">
                  {purchaseItems.map((item) => {
                    const suggestedFinalUnitPrice =
                      getSuggestedFinalUnitPrice(item)
                    const itemFinalTotal = getFinalTotalForItem(item)

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-secondary/15 bg-white p-4 shadow-sm"
                      >
                        <p className="mb-3 font-black text-secondary">
                          Article {item.item_index}
                        </p>
                        <div className="grid gap-4 tablet:grid-cols-3">
                          <label className="flex flex-col gap-2 text-base font-bold text-slate-700">
                            Prix unitaire final
                            <input
                              type="number"
                              min="0"
                              max={MAX_PRICE}
                              step="0.01"
                              inputMode="decimal"
                              value={finalUnitPrices[item.id] ?? ""}
                              onChange={(event) => {
                                setFinalUnitPrices((currentPrices) => ({
                                  ...currentPrices,
                                  [item.id]: sanitizePrice(event.target.value),
                                }))
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
                            Quantite achetee
                            <input
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={orderedQuantities[item.id] ?? ""}
                              onChange={(event) => {
                                setOrderedQuantities((currentQuantities) => ({
                                  ...currentQuantities,
                                  [item.id]: sanitizeQuantity(
                                    event.target.value,
                                  ),
                                }))
                                setSubmitError(null)
                              }}
                              placeholder={String(
                                item.ordered_quantity ?? item.quantity,
                              )}
                              className="h-13 min-h-13 rounded-lg border border-secondary/20 bg-white px-3 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
                              required
                            />
                          </label>
                          <div className="rounded-lg border border-secondary/15 bg-tertiary/70 px-4 py-3 text-base leading-7 text-slate-700">
                            <span className="font-bold text-secondary">
                              Total:
                            </span>{" "}
                            {itemFinalTotal !== null
                              ? formatCurrency(itemFinalTotal)
                              : "A calculer"}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <label className="flex flex-col gap-2 text-base font-bold text-slate-700">
                  Reference d'achat
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
                      requestMetadata?.purchase_reference ||
                      "Numero de facture, commande ou recu"
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
                      suggestedFinalSupplier || "Fournisseur utilise pour l'achat"
                    }
                    className="h-13 min-h-13 rounded-lg border border-secondary/20 bg-white px-3 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <div className="rounded-lg border border-secondary/15 bg-tertiary/70 px-4 py-3 text-base leading-7 text-slate-700 tablet:col-span-2">
                  <span className="font-bold text-secondary">Total final: </span>
                  {formatCurrency(finalTotal)}
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
                      {purchaseDocuments.length}/{MAX_PURCHASE_DOCUMENTS}{" "}
                      fichier(s) - JPG, PNG, WEBP ou PDF - Maximum{" "}
                      {MAX_PURCHASE_DOCUMENT_SIZE_MB} MB
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
                        stripUnsafeText(
                          event.target.value,
                          MAX_PURCHASE_NOTE_LENGTH,
                        ),
                      )
                    }
                    rows={4}
                    maxLength={MAX_PURCHASE_NOTE_LENGTH}
                    placeholder={
                      requestMetadata?.purchase_note ||
                      "Details utiles: livraison, garantie, emplacement, suivi, etc."
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
              Une fois confirme, la demande sera marquee comme achetee avec les
              informations finales.
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
