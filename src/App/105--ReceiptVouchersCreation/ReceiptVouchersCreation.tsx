import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useReceiptVoucher } from "../../Contexts/ReceiptVoucherContext"
import { useBuying, type Supplier } from "../../Contexts/BuyingContext"
import SuccesOverlay from "../SuccesOverlay"
import vegibecLogo from "../../assets/vegibec.png"

type ReceiptVoucherItemForm = {
  purchase_request_item_id: number
  purchase_order_item_id: number | null
  code: string
  description: string
  quantity: string
  quantity_format: string
  received_quantity: string
  comment: string
  selected: boolean
}

type RequestItemWithReceiptDetails = {
  id: number
  purchase_order_item_id?: number | null
  purchase_order_item?: PurchaseOrderItemSnapshot | null
  purchase_order?: PurchaseOrderSnapshot | null
  item_code?: string | null
  code?: string | null
  description: string
  item_description?: string | null
  quantity: number
  ordered_quantity?: number | string | null
  quantity_format: string | null
  ordered_unit?: string | null
}

type PurchaseOrderItemSnapshot = {
  id?: number | null
  item_code?: string | null
  item_description?: string | null
  ordered_quantity?: number | string | null
  ordered_unit?: string | null
  purchase_order?: PurchaseOrderSnapshot | null
}

type PurchaseOrderSnapshot = {
  id?: number | null
  supplier_id?: number | null
  supplier_name?: string | null
  supplier?: string | null
  supplier_address_snapshot?: string | null
  supplier_phone?: string | null
  purchased_at?: string | null
  ordered_at?: string | null
  delivery_method?: string | null
  shipping_address_snapshot?: string | null
  buyer_name?: string | null
  purchased_by_name?: string | null
  purchased_by_surname?: string | null
  purchase_order_items?: PurchaseOrderItemSnapshot[] | null
}

type ReceiptVoucherRequestWithPurchaseOrder = {
  purchase_order?: PurchaseOrderSnapshot | null
  purchase_orders?: PurchaseOrderSnapshot[] | null
  items?: RequestItemWithReceiptDetails[]
}

const VEGIBEC_ADDRESS = [
  "Vegibec",
  "171 Rang Ste-Sophie",
  "OKA",
  "J0N 1E0 Québec, Canada",
  "4505960566",
].join("\n")

const DEFAULT_RECEIVED_BY_USER_ID = 1

const getTodayDateInputValue = () => {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const toNullableText = (value: string) => {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

const toRoundedNumber = (value: string, decimals = 4) => {
  const number = Number(value.trim().replace(",", "."))

  if (!Number.isFinite(number)) return null

  const factor = 10 ** decimals
  return Math.round((number + Number.EPSILON) * factor) / factor
}

const getFullName = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(" ")

const getSupplierAddress = (supplier: Supplier) =>
  [
    supplier.name,
    supplier.address_snapshot,
    supplier.city,
    supplier.province,
    supplier.postal_code,
    supplier.country,
  ]
    .filter(Boolean)
    .join("\n")

const getPurchaseOrderAddress = (purchaseOrder: PurchaseOrderSnapshot) =>
  purchaseOrder.supplier_address_snapshot ||
  [purchaseOrder.supplier_name ?? purchaseOrder.supplier]
    .filter(Boolean)
    .join("\n")

const getPurchaseOrderBuyerName = (purchaseOrder: PurchaseOrderSnapshot) =>
  purchaseOrder.buyer_name ||
  getFullName(purchaseOrder.purchased_by_name, purchaseOrder.purchased_by_surname)

const getFirstPurchaseOrder = (
  request: ReceiptVoucherRequestWithPurchaseOrder,
) => {
  if (request.purchase_order) return request.purchase_order
  if (request.purchase_orders?.[0]) return request.purchase_orders[0]

  return (
    request.items?.find((item) => item.purchase_order)?.purchase_order ??
    request.items?.find((item) => item.purchase_order_item?.purchase_order)
      ?.purchase_order_item?.purchase_order ??
    null
  )
}

const getSupplierFromPurchaseOrder = (
  purchaseOrder: PurchaseOrderSnapshot | null,
  suppliers: Supplier[],
) => {
  if (!purchaseOrder?.supplier_id) return null

  return (
    suppliers.find((supplier) => supplier.id === purchaseOrder.supplier_id) ??
    null
  )
}

const createItemsFromRequest = (
  items: RequestItemWithReceiptDetails[],
): ReceiptVoucherItemForm[] =>
  items.map((item) => {
    const purchaseOrderItem = item.purchase_order_item
    const quantity =
      purchaseOrderItem?.ordered_quantity ?? item.ordered_quantity ?? item.quantity ?? ""

    return {
      purchase_request_item_id: item.id,
      purchase_order_item_id:
        item.purchase_order_item_id ?? purchaseOrderItem?.id ?? null,
      code: purchaseOrderItem?.item_code ?? item.item_code ?? item.code ?? "",
      description:
        purchaseOrderItem?.item_description ??
        item.item_description ??
        item.description ??
        "",
      quantity: String(quantity),
      quantity_format:
        purchaseOrderItem?.ordered_unit ?? item.ordered_unit ?? item.quantity_format ?? "",
      received_quantity: String(quantity),
      comment: "",
      selected: true,
    }
  })

const ReceiptVouchersCreation = () => {
  const { id, token } = useParams<{ id: string; token: string }>()
  const { suppliers, fetchSuppliers } = useBuying()
  const {
    receiptVoucherRequest,
    lastCreatedReceiptVoucher,
    fetchReceiptVoucherRequestByToken,
    createReceiptVoucher,
    loadingReceiptVoucher,
    receiptVoucherError,
    clearReceiptVoucherError,
  } = useReceiptVoucher()

  const [receivedAt, setReceivedAt] = useState(getTodayDateInputValue())
  const [orderedAt, setOrderedAt] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState("")
  const [pickupSupplierId, setPickupSupplierId] = useState("")
  const [pickupFrom, setPickupFrom] = useState("")
  const [pickupPhone, setPickupPhone] = useState("")
  const [shippedTo, setShippedTo] = useState(VEGIBEC_ADDRESS)
  const [buyerName, setBuyerName] = useState("")
  const [receiptNote, setReceiptNote] = useState("")
  const [items, setItems] = useState<ReceiptVoucherItemForm[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (!id || !token) return

    let cancelled = false

    Promise.all([
      fetchSuppliers(),
      fetchReceiptVoucherRequestByToken(Number(id), token),
    ]).then(([loadedSuppliers, request]) => {
      if (cancelled || !request) return

      const receiptRequest = request as ReceiptVoucherRequestWithPurchaseOrder
      const purchaseOrder = getFirstPurchaseOrder(receiptRequest)
      const purchaseOrderSupplier = getSupplierFromPurchaseOrder(
        purchaseOrder,
        loadedSuppliers,
      )

      setItems(createItemsFromRequest(receiptRequest.items ?? []))
      setPickupSupplierId(
        purchaseOrder?.supplier_id ? String(purchaseOrder.supplier_id) : "",
      )
      setPickupFrom(
        getPurchaseOrderAddress(purchaseOrder ?? {}) ||
          (purchaseOrderSupplier ? getSupplierAddress(purchaseOrderSupplier) : ""),
      )
      setPickupPhone(
        purchaseOrder?.supplier_phone ??
          purchaseOrderSupplier?.phone ??
          purchaseOrderSupplier?.supplier_phone ??
          "",
      )
      setBuyerName(
        getPurchaseOrderBuyerName(purchaseOrder ?? {}) ||
          getFullName(request.purchased_by_name, request.purchased_by_surname),
      )
      setDeliveryMethod(purchaseOrder?.delivery_method ?? "")
      setShippedTo(purchaseOrder?.shipping_address_snapshot || VEGIBEC_ADDRESS)
      setOrderedAt(
        purchaseOrder?.ordered_at?.slice(0, 10) ??
          purchaseOrder?.purchased_at?.slice(0, 10) ??
          request.updated_at?.slice(0, 10) ??
          "",
      )
    })

    return () => {
      cancelled = true
    }
  }, [id, token, fetchReceiptVoucherRequestByToken, fetchSuppliers])

  const selectPickupSupplier = (supplierId: string) => {
    setPickupSupplierId(supplierId)

    if (!supplierId) {
      setPickupFrom("")
      setPickupPhone("")
      return
    }

    const supplier = suppliers.find(
      (currentSupplier) => String(currentSupplier.id) === supplierId,
    )

    if (!supplier) return

    setPickupFrom(getSupplierAddress(supplier))
    setPickupPhone(supplier.phone ?? supplier.supplier_phone ?? "")
  }

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected),
    [items],
  )

  const updateItem = (
    purchaseRequestItemId: number,
    update: Partial<ReceiptVoucherItemForm>,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.purchase_request_item_id === purchaseRequestItemId
          ? { ...item, ...update }
          : item,
      ),
    )
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    clearReceiptVoucherError()

    if (!id || !token || !receiptVoucherRequest) {
      setSubmitError("Lien de réception invalide.")
      return
    }

    if (selectedItems.length === 0) {
      setSubmitError("Cochez au moins un article reçu.")
      return
    }

    const invalidItem = selectedItems.find((item) => {
      const quantity = toRoundedNumber(item.quantity)
      const receivedQuantity = toRoundedNumber(item.received_quantity)

      return (
        quantity === null ||
        quantity <= 0 ||
        receivedQuantity === null ||
        receivedQuantity <= 0
      )
    })

    if (invalidItem) {
      setSubmitError("Chaque article doit avoir une quantité valide.")
      return
    }

    const result = await createReceiptVoucher(Number(id), token, {
      purchase_request_id: receiptVoucherRequest.id,
      received_by_user_id: DEFAULT_RECEIVED_BY_USER_ID,
      received_at: receivedAt || null,
      receipt_note: toNullableText(receiptNote),
      items: selectedItems.map((item) => ({
        purchase_request_item_id: item.purchase_request_item_id,
        purchase_order_item_id: item.purchase_order_item_id,
        quantity: toRoundedNumber(item.quantity) ?? 0,
        received_quantity: toRoundedNumber(item.received_quantity) ?? 0,
        comment: toNullableText(item.comment),
      })),
    })

    if (!result) {
      setSubmitError("Erreur lors de la création du bon de réception.")
      return
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    setSubmitSuccess(true)
  }

  if (loadingReceiptVoucher && !receiptVoucherRequest) {
    return <main className="min-h-screen bg-tertiary p-6">Chargement...</main>
  }

  if (receiptVoucherError && !receiptVoucherRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6 text-red-700">
        {receiptVoucherError}
      </main>
    )
  }

  if (!receiptVoucherRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6">
        Demande introuvable.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-tertiary px-4 py-6">
      {submitSuccess && (
        <SuccesOverlay
          successMessage="Le bon de réception a été créé avec succès."
          onClose={() => setSubmitSuccess(false)}
          name="Ricardo"
        />
      )}

      <div className="mx-auto max-w-5xl space-y-5">
        {lastCreatedReceiptVoucher && (
          <section className="rounded-xl border border-[#4B7312]/30 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase text-slate-500">
              Bon de réception créé
            </p>
            <p className="mt-1 text-xl font-bold text-[#4B7312] wrap-anywhere">
              {lastCreatedReceiptVoucher.receipt_voucher_reference}
            </p>
          </section>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <header className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div>
              <img
                src={vegibecLogo}
                alt="Vegibec"
                className="h-auto w-44 max-w-full"
              />
            </div>

            <div className="text-sm font-medium leading-6 text-slate-900 md:text-center">
              <p className="text-2xl font-black">Vegibec</p>
              <p>171 Rang Ste-Sophie</p>
              <p>OKA, Québec, Canada, J0N 1E0</p>
              <p>Téléphone (450) 596-0566</p>
              <p>entrepot@vegibec.com</p>
            </div>

            <div className="text-left md:text-right">
              <h1 className="text-3xl font-black text-slate-950">
                Bon de réception
              </h1>
              <p className="mt-2 text-sm font-black uppercase text-slate-500">
                # Commande
              </p>
              <p className="text-lg font-bold text-slate-700 wrap-anywhere">
                {receiptVoucherRequest.request_reference ??
                  receiptVoucherRequest.id}
              </p>
            </div>
          </header>

          <div className="mt-6 border-t-4 border-[#1f6b24]" />

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <section className="rounded-xl border border-[#d2dfd2] p-4">
              <h2 className="text-lg font-black text-[#1f6b24]">
                Ramassé chez
              </h2>
              <select
                value={pickupSupplierId}
                onChange={(event) => selectPickupSupplier(event.target.value)}
                className="mt-4 w-full rounded-lg border border-[#d2dfd2] px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <label className="mt-3 block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Adresse
                </span>
                <textarea
                  value={pickupFrom}
                  onChange={(event) => setPickupFrom(event.target.value)}
                  className="mt-2 min-h-28 w-full resize-none rounded-lg border border-transparent p-2 text-sm leading-6 text-slate-900 outline-none focus:border-[#4B7312]"
                />
              </label>

              <label className="mt-3 block border-t border-[#d2dfd2] pt-3">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Téléphone
                </span>
                <input
                  value={pickupPhone}
                  onChange={(event) => setPickupPhone(event.target.value)}
                  placeholder="Numéro du fournisseur"
                  className="mt-2 w-full rounded-lg border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                />
              </label>
            </section>

            <section className="rounded-xl border border-[#d2dfd2] p-4">
              <h2 className="text-lg font-black text-[#1f6b24]">Expédié à</h2>
              <textarea
                value={shippedTo}
                onChange={(event) => setShippedTo(event.target.value)}
                className="mt-4 min-h-28 w-full resize-none rounded-lg border border-transparent p-2 text-sm leading-6 text-slate-900 outline-none focus:border-[#4B7312]"
              />

              <div className="mt-4 border-t border-[#d2dfd2] pt-4">
                <label className="block">
                  <span className="text-lg font-black text-[#1f6b24]">
                    Acheteur
                  </span>
                  <input
                    value={buyerName}
                    onChange={(event) => setBuyerName(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-transparent px-2 py-2 text-sm text-slate-900 outline-none focus:border-[#4B7312]"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-[#d2dfd2] p-4">
              <label className="block">
                <span className="text-lg font-black text-[#1f6b24]">
                  Date commandé
                </span>
                <input
                  type="date"
                  value={orderedAt}
                  onChange={(event) => setOrderedAt(event.target.value)}
                  className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
                />
              </label>

              <label className="mt-6 block">
                <span className="text-lg font-black text-[#1f6b24]">
                  Date de réception
                </span>
                <input
                  type="date"
                  value={receivedAt}
                  onChange={(event) => setReceivedAt(event.target.value)}
                  className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
                />
              </label>

              <label className="mt-6 block">
                <span className="text-lg font-black text-[#1f6b24]">
                  Méthode de livraison
                </span>
                <input
                  value={deliveryMethod}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                  className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
                />
              </label>
            </section>
          </div>

          <div className="mt-6 rounded-xl border border-[#d2dfd2] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#1f6b24]">
                Articles reçus
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                {selectedItems.length} article
                {selectedItems.length > 1 ? "s" : ""} sélectionné
                {selectedItems.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="mt-3 grid gap-2">
              {items.map((item) => (
                <label
                  key={item.purchase_request_item_id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-[#4B7312]"
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(event) =>
                      updateItem(item.purchase_request_item_id, {
                        selected: event.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 wrap-anywhere">
                      {item.description}
                    </p>
                    <p className="text-sm text-slate-600">
                      Quantité commandée: {item.quantity} {item.quantity_format}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-200 table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[43%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-center text-sm font-black text-slate-950">
                  <th className="border border-[#d2dfd2] px-3 py-3">Code</th>
                  <th className="border border-[#d2dfd2] px-3 py-3">
                    Description
                  </th>
                  <th className="border border-[#d2dfd2] px-3 py-3">Qte</th>
                  <th className="border border-[#d2dfd2] px-3 py-3">
                    Qte reçue
                  </th>
                  <th className="border border-[#d2dfd2] px-3 py-3">
                    Commentaire
                  </th>
                </tr>
              </thead>

              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.purchase_request_item_id} className="align-top">
                    <td className="border border-[#d2dfd2] p-2">
                      <input
                        value={item.code}
                        onChange={(event) =>
                          updateItem(item.purchase_request_item_id, {
                            code: event.target.value,
                          })
                        }
                        className="w-full rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                      />
                    </td>

                    <td className="border border-[#d2dfd2] p-2">
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          updateItem(item.purchase_request_item_id, {
                            description: event.target.value,
                          })
                        }
                        className="min-h-16 w-full resize-none rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                      />
                    </td>

                    <td className="border border-[#d2dfd2] p-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.purchase_request_item_id, {
                              quantity: event.target.value,
                            })
                          }
                          className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                        />
                        <span className="py-2 text-xs font-semibold text-slate-500">
                          {item.quantity_format}
                        </span>
                      </div>
                    </td>

                    <td className="border border-[#d2dfd2] p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.received_quantity}
                        onChange={(event) =>
                          updateItem(item.purchase_request_item_id, {
                            received_quantity: event.target.value,
                          })
                        }
                        className="w-full rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                      />
                    </td>

                    <td className="border border-[#d2dfd2] p-2">
                      <textarea
                        value={item.comment}
                        onChange={(event) =>
                          updateItem(item.purchase_request_item_id, {
                            comment: event.target.value,
                          })
                        }
                        className="min-h-16 w-full resize-none rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                      />
                    </td>
                  </tr>
                ))}

                {selectedItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-[#d2dfd2] px-3 py-10 text-center text-sm font-semibold text-slate-500"
                    >
                      Cochez au moins un article à recevoir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                Note de réception
              </span>
              <textarea
                value={receiptNote}
                onChange={(event) => setReceiptNote(event.target.value)}
                className="mt-2 min-h-20 w-full rounded-lg border border-[#d2dfd2] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="sticky bottom-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          {(submitError || receiptVoucherError) && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {submitError || receiptVoucherError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {selectedItems.length} article
              {selectedItems.length > 1 ? "s" : ""} sur le bon de réception.
            </p>

            <button
              type="button"
              disabled={selectedItems.length === 0 || loadingReceiptVoucher}
              onClick={handleSubmit}
              className="cursor-pointer rounded-xl bg-[#4B7312] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingReceiptVoucher
                ? "Création..."
                : "Créer le bon de réception"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ReceiptVouchersCreation
