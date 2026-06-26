import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useReceiptVoucher, type ReceiptVoucher } from "../../Contexts/ReceiptVoucherContext"
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
}

type ReceiptVoucherGroupForm = {
  localId: string
  purchase_order_id: number | null
  purchaseOrderItemsByRequestItemId: Record<number, PurchaseOrderItemSnapshot>
  pickupSupplierId: string
  pickupFrom: string
  pickupPhone: string
  shippedTo: string
  buyerName: string
  orderedAt: string
  receivedAt: string
  deliveryMethod: string
  receiptNote: string
  items: ReceiptVoucherItemForm[]
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
  purchase_request_item_id?: number | null
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
  purchased_by_name?: string | null
  purchased_by_surname?: string | null
  updated_at?: string | null
}

type ReceiptVoucherDocumentProps = {
  group: ReceiptVoucherGroupForm
  groupIndex: number
  groupsCount: number
  suppliers: Supplier[]
  requestItems: RequestItemWithReceiptDetails[]
  selectedItemIdsInOtherGroups: Set<number>
  canRemove: boolean
  requestReference: string | number
  onChange: (group: ReceiptVoucherGroupForm) => void
  onRemove: () => void
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

const getItemPurchaseOrder = (item: RequestItemWithReceiptDetails) =>
  item.purchase_order ?? item.purchase_order_item?.purchase_order ?? null

const getKnownPurchaseOrders = (
  request: ReceiptVoucherRequestWithPurchaseOrder,
) => {
  const purchaseOrders = request.purchase_orders?.length
    ? request.purchase_orders
    : request.purchase_order
      ? [request.purchase_order]
      : []

  const purchaseOrdersById = new Map<number, PurchaseOrderSnapshot>()

  purchaseOrders.forEach((purchaseOrder) => {
    if (purchaseOrder?.id) purchaseOrdersById.set(purchaseOrder.id, purchaseOrder)
  })

  request.items?.forEach((item) => {
    const purchaseOrder = getItemPurchaseOrder(item)
    if (purchaseOrder?.id) purchaseOrdersById.set(purchaseOrder.id, purchaseOrder)
  })

  return [...purchaseOrdersById.values()]
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

const createItemFromRequest = (
  item: RequestItemWithReceiptDetails,
  purchaseOrderItemOverride?: PurchaseOrderItemSnapshot | null,
): ReceiptVoucherItemForm => {
  const purchaseOrderItem = purchaseOrderItemOverride ?? item.purchase_order_item
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
  }
}

const createGroupFromPurchaseOrder = ({
  purchaseOrder,
  request,
  suppliers,
  items,
  purchaseOrderItemsByRequestItemId = new Map(),
}: {
  purchaseOrder: PurchaseOrderSnapshot | null
  request: ReceiptVoucherRequestWithPurchaseOrder
  suppliers: Supplier[]
  items: RequestItemWithReceiptDetails[]
  purchaseOrderItemsByRequestItemId?: Map<number, PurchaseOrderItemSnapshot>
}): ReceiptVoucherGroupForm => {
  const purchaseOrderSupplier = getSupplierFromPurchaseOrder(purchaseOrder, suppliers)

  return {
    localId: crypto.randomUUID(),
    purchase_order_id: purchaseOrder?.id ?? null,
    purchaseOrderItemsByRequestItemId: Object.fromEntries(
      purchaseOrderItemsByRequestItemId,
    ),
    pickupSupplierId: purchaseOrder?.supplier_id ? String(purchaseOrder.supplier_id) : "",
    pickupFrom:
      getPurchaseOrderAddress(purchaseOrder ?? {}) ||
      (purchaseOrderSupplier ? getSupplierAddress(purchaseOrderSupplier) : ""),
    pickupPhone:
      purchaseOrder?.supplier_phone ??
      purchaseOrderSupplier?.phone ??
      purchaseOrderSupplier?.supplier_phone ??
      "",
    shippedTo: purchaseOrder?.shipping_address_snapshot || VEGIBEC_ADDRESS,
    buyerName:
      getPurchaseOrderBuyerName(purchaseOrder ?? {}) ||
      getFullName(request.purchased_by_name, request.purchased_by_surname),
    orderedAt:
      purchaseOrder?.ordered_at?.slice(0, 10) ??
      purchaseOrder?.purchased_at?.slice(0, 10) ??
      request.updated_at?.slice(0, 10) ??
      "",
    receivedAt: getTodayDateInputValue(),
    deliveryMethod: purchaseOrder?.delivery_method ?? "",
    receiptNote: "",
    items: items.map((item) =>
      createItemFromRequest(
        item,
        purchaseOrderItemsByRequestItemId.get(item.id),
      ),
    ),
  }
}

const createEmptyGroup = (): ReceiptVoucherGroupForm => ({
  localId: crypto.randomUUID(),
  purchase_order_id: null,
  purchaseOrderItemsByRequestItemId: {},
  pickupSupplierId: "",
  pickupFrom: "",
  pickupPhone: "",
  shippedTo: VEGIBEC_ADDRESS,
  buyerName: "",
  orderedAt: "",
  receivedAt: getTodayDateInputValue(),
  deliveryMethod: "",
  receiptNote: "",
  items: [],
})

const createGroupsFromRequest = (
  request: ReceiptVoucherRequestWithPurchaseOrder,
  suppliers: Supplier[],
) => {
  const requestItems = request.items ?? []
  const purchaseOrders = getKnownPurchaseOrders(request)

  if (purchaseOrders.length === 0) {
    return [
      createGroupFromPurchaseOrder({
        purchaseOrder: null,
        request,
        suppliers,
        items: requestItems,
      }),
    ]
  }

  const groups = purchaseOrders.map((purchaseOrder) => {
    const purchaseOrderItemsByRequestItemId = new Map<
      number,
      PurchaseOrderItemSnapshot
    >()

    purchaseOrder.purchase_order_items?.forEach((purchaseOrderItem) => {
      if (purchaseOrderItem.purchase_request_item_id) {
        purchaseOrderItemsByRequestItemId.set(
          purchaseOrderItem.purchase_request_item_id,
          purchaseOrderItem,
        )
      }
    })

    const itemsForPurchaseOrder = requestItems.filter((item) => {
      const itemPurchaseOrder = getItemPurchaseOrder(item)
      const itemPurchaseOrderId =
        itemPurchaseOrder?.id ?? item.purchase_order_item?.purchase_order?.id

      if (purchaseOrderItemsByRequestItemId.has(item.id)) {
        return true
      }

      if (!itemPurchaseOrderId) {
        return purchaseOrders.length === 1
      }

      return itemPurchaseOrderId === purchaseOrder.id
    })

    return createGroupFromPurchaseOrder({
      purchaseOrder,
      request,
      suppliers,
      items: itemsForPurchaseOrder,
      purchaseOrderItemsByRequestItemId,
    })
  })

  const groupedItemIds = new Set(
    groups.flatMap((group) =>
      group.items.map((item) => item.purchase_request_item_id),
    ),
  )
  const ungroupedItems = requestItems.filter((item) => !groupedItemIds.has(item.id))

  if (ungroupedItems.length > 0) {
    groups[0] = {
      ...groups[0],
      items: [
        ...groups[0].items,
        ...ungroupedItems.map((item) => createItemFromRequest(item)),
      ],
    }
  }

  return groups.length > 0 ? groups : [createEmptyGroup()]
}

const ReceiptVoucherDocument = ({
  group,
  groupIndex,
  groupsCount,
  suppliers,
  requestItems,
  selectedItemIdsInOtherGroups,
  canRemove,
  requestReference,
  onChange,
  onRemove,
}: ReceiptVoucherDocumentProps) => {
  const selectedItemIds = useMemo(
    () => new Set(group.items.map((item) => item.purchase_request_item_id)),
    [group.items],
  )

  const selectPickupSupplier = (supplierId: string) => {
    if (!supplierId) {
      onChange({
        ...group,
        pickupSupplierId: "",
        pickupFrom: "",
        pickupPhone: "",
      })
      return
    }

    const supplier = suppliers.find(
      (currentSupplier) => String(currentSupplier.id) === supplierId,
    )

    if (!supplier) return

    onChange({
      ...group,
      pickupSupplierId: supplierId,
      pickupFrom: getSupplierAddress(supplier),
      pickupPhone: supplier.phone ?? supplier.supplier_phone ?? "",
    })
  }

  const toggleItem = (requestItem: RequestItemWithReceiptDetails) => {
    if (selectedItemIds.has(requestItem.id)) {
      onChange({
        ...group,
        items: group.items.filter(
          (item) => item.purchase_request_item_id !== requestItem.id,
        ),
      })
      return
    }

    onChange({
      ...group,
      items: [
        ...group.items,
        createItemFromRequest(
          requestItem,
          group.purchaseOrderItemsByRequestItemId[requestItem.id],
        ),
      ],
    })
  }

  const updateItem = (
    purchaseRequestItemId: number,
    update: Partial<ReceiptVoucherItemForm>,
  ) => {
    onChange({
      ...group,
      items: group.items.map((item) =>
        item.purchase_request_item_id === purchaseRequestItemId
          ? { ...item, ...update }
          : item,
      ),
    })
  }

  return (
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
            {requestReference}
            {groupsCount > 1 ? `-${groupIndex + 1}` : ""}
          </p>
        </div>
      </header>

      <div className="mt-6 border-t-4 border-[#1f6b24]" />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          Bon {groupIndex + 1} de {groupsCount}
        </p>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Retirer ce bon
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <section className="rounded-xl border border-[#d2dfd2] p-4">
          <h2 className="text-lg font-black text-[#1f6b24]">Ramassé chez</h2>
          <select
            value={group.pickupSupplierId}
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
              value={group.pickupFrom}
              onChange={(event) =>
                onChange({ ...group, pickupFrom: event.target.value })
              }
              className="mt-2 min-h-28 w-full resize-none rounded-lg border border-transparent p-2 text-sm leading-6 text-slate-900 outline-none focus:border-[#4B7312]"
            />
          </label>

          <label className="mt-3 block border-t border-[#d2dfd2] pt-3">
            <span className="text-sm font-black uppercase text-[#1f6b24]">
              Téléphone
            </span>
            <input
              value={group.pickupPhone}
              onChange={(event) =>
                onChange({ ...group, pickupPhone: event.target.value })
              }
              placeholder="Numéro du fournisseur"
              className="mt-2 w-full rounded-lg border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
            />
          </label>
        </section>

        <section className="rounded-xl border border-[#d2dfd2] p-4">
          <h2 className="text-lg font-black text-[#1f6b24]">Expédié à</h2>
          <textarea
            value={group.shippedTo}
            onChange={(event) =>
              onChange({ ...group, shippedTo: event.target.value })
            }
            className="mt-4 min-h-28 w-full resize-none rounded-lg border border-transparent p-2 text-sm leading-6 text-slate-900 outline-none focus:border-[#4B7312]"
          />

          <div className="mt-4 border-t border-[#d2dfd2] pt-4">
            <label className="block">
              <span className="text-lg font-black text-[#1f6b24]">
                Acheteur
              </span>
              <input
                value={group.buyerName}
                onChange={(event) =>
                  onChange({ ...group, buyerName: event.target.value })
                }
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
              value={group.orderedAt}
              onChange={(event) =>
                onChange({ ...group, orderedAt: event.target.value })
              }
              className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-lg font-black text-[#1f6b24]">
              Date de réception
            </span>
            <input
              type="date"
              value={group.receivedAt}
              onChange={(event) =>
                onChange({ ...group, receivedAt: event.target.value })
              }
              className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-lg font-black text-[#1f6b24]">
              Méthode de livraison
            </span>
            <input
              value={group.deliveryMethod}
              onChange={(event) =>
                onChange({ ...group, deliveryMethod: event.target.value })
              }
              className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
            />
          </label>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-[#d2dfd2] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#1f6b24]">Articles reçus</h2>
          <p className="text-sm font-semibold text-slate-500">
            {group.items.length} article{group.items.length > 1 ? "s" : ""}{" "}
            sélectionné{group.items.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-3 grid gap-2">
          {requestItems.map((requestItem) => {
            const selectedInOtherGroup = selectedItemIdsInOtherGroups.has(
              requestItem.id,
            )
            const selected = selectedItemIds.has(requestItem.id)

            return (
              <label
                key={requestItem.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  selectedInOtherGroup
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                    : "cursor-pointer border-slate-200 hover:border-[#4B7312]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={selectedInOtherGroup}
                  onChange={() => toggleItem(requestItem)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 wrap-anywhere">
                    {createItemFromRequest(requestItem).description}
                  </p>
                  <p className="text-sm text-slate-600">
                    Quantité commandée: {createItemFromRequest(requestItem).quantity}{" "}
                    {createItemFromRequest(requestItem).quantity_format}
                  </p>
                  {selectedInOtherGroup && (
                    <p className="mt-1 text-xs font-semibold text-orange-700">
                      Déjà inclus dans un autre bon de réception
                    </p>
                  )}
                </div>
              </label>
            )
          })}
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
            {group.items.map((item) => (
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

            {group.items.length === 0 && (
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
            value={group.receiptNote}
            onChange={(event) =>
              onChange({ ...group, receiptNote: event.target.value })
            }
            className="mt-2 min-h-20 w-full rounded-lg border border-[#d2dfd2] px-3 py-2 text-sm"
          />
        </label>
      </div>
    </section>
  )
}

const ReceiptVouchersCreation = () => {
  const { id, token } = useParams<{ id: string; token: string }>()
  const { suppliers, fetchSuppliers } = useBuying()
  const {
    receiptVoucherRequest,
    fetchReceiptVoucherRequestByToken,
    createReceiptVoucher,
    loadingReceiptVoucher,
    receiptVoucherError,
    clearReceiptVoucherError,
  } = useReceiptVoucher()

  const [groups, setGroups] = useState<ReceiptVoucherGroupForm[]>([
    createEmptyGroup(),
  ])
  const [requestItems, setRequestItems] = useState<RequestItemWithReceiptDetails[]>(
    [],
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [createdReceiptVouchers, setCreatedReceiptVouchers] = useState<
    ReceiptVoucher[]
  >([])

  useEffect(() => {
    if (!id || !token) return

    let cancelled = false

    Promise.all([
      fetchSuppliers(),
      fetchReceiptVoucherRequestByToken(Number(id), token),
    ]).then(([loadedSuppliers, request]) => {
      if (cancelled || !request) return

      const receiptRequest = request as ReceiptVoucherRequestWithPurchaseOrder
      const items = receiptRequest.items ?? []

      setRequestItems(items)
      setGroups(createGroupsFromRequest(receiptRequest, loadedSuppliers))
    })

    return () => {
      cancelled = true
    }
  }, [id, token, fetchReceiptVoucherRequestByToken, fetchSuppliers])

  const activeGroups = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups],
  )

  const selectedRequestItemIds = useMemo(
    () =>
      new Set(
        groups.flatMap((group) =>
          group.items.map((item) => item.purchase_request_item_id),
        ),
      ),
    [groups],
  )

  const addGroup = () => {
    setGroups((prev) => [...prev, createEmptyGroup()])
  }

  const removeGroup = (localId: string) => {
    setGroups((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((group) => group.localId !== localId),
    )
  }

  const updateGroup = (
    localId: string,
    updatedGroup: ReceiptVoucherGroupForm,
  ) => {
    setGroups((prev) =>
      prev.map((group) => (group.localId === localId ? updatedGroup : group)),
    )
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    setCreatedReceiptVouchers([])
    clearReceiptVoucherError()

    if (!id || !token || !receiptVoucherRequest) {
      setSubmitError("Lien de réception invalide.")
      return
    }

    if (activeGroups.length === 0) {
      setSubmitError("Cochez au moins un article reçu.")
      return
    }

    const invalidGroup = activeGroups.find((group) =>
      group.items.some((item) => {
        const quantity = toRoundedNumber(item.quantity)
        const receivedQuantity = toRoundedNumber(item.received_quantity)

        return (
          quantity === null ||
          quantity <= 0 ||
          receivedQuantity === null ||
          receivedQuantity <= 0
        )
      }),
    )

    if (invalidGroup) {
      setSubmitError("Chaque article doit avoir une quantité valide.")
      return
    }

    const createdVouchers: ReceiptVoucher[] = []

    for (const group of activeGroups) {
      const result = await createReceiptVoucher(Number(id), token, {
        purchase_request_id: receiptVoucherRequest.id,
        received_by_user_id: DEFAULT_RECEIVED_BY_USER_ID,
        received_at: group.receivedAt || null,
        receipt_note: toNullableText(group.receiptNote),
        items: group.items.map((item) => ({
          purchase_request_item_id: item.purchase_request_item_id,
          purchase_order_item_id: item.purchase_order_item_id,
          quantity: toRoundedNumber(item.quantity) ?? 0,
          received_quantity: toRoundedNumber(item.received_quantity) ?? 0,
          comment: toNullableText(item.comment),
        })),
      })

      if (!result) {
        setSubmitError("Erreur lors de la création d'un bon de réception.")
        return
      }

      createdVouchers.push(result.receipt_voucher)
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    setCreatedReceiptVouchers(createdVouchers)
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
          successMessage="Le ou les bons de réception ont été créés avec succès."
          onClose={() => setSubmitSuccess(false)}
          name="Ricardo"
        />
      )}

      <div className="mx-auto max-w-5xl space-y-5">
        {createdReceiptVouchers.length > 0 && (
          <section className="rounded-xl border border-[#4B7312]/30 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase text-slate-500">
              Bons de réception créés ({createdReceiptVouchers.length})
            </p>
            <div className="mt-3 grid gap-2">
              {createdReceiptVouchers.map((voucher, index) => (
                <p
                  key={voucher.id}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-[#4B7312] wrap-anywhere"
                >
                  Bon {index + 1}: {voucher.receipt_voucher_reference}
                </p>
              ))}
            </div>
          </section>
        )}

        {groups.map((group, index) => {
          const selectedItemIdsInOtherGroups = new Set(
            groups
              .filter((currentGroup) => currentGroup.localId !== group.localId)
              .flatMap((currentGroup) =>
                currentGroup.items.map((item) => item.purchase_request_item_id),
              ),
          )

          return (
            <ReceiptVoucherDocument
              key={group.localId}
              group={group}
              groupIndex={index}
              groupsCount={groups.length}
              suppliers={suppliers}
              requestItems={requestItems}
              selectedItemIdsInOtherGroups={selectedItemIdsInOtherGroups}
              canRemove={groups.length > 1}
              requestReference={
                receiptVoucherRequest.request_reference ?? receiptVoucherRequest.id
              }
              onChange={(updatedGroup) =>
                updateGroup(group.localId, updatedGroup)
              }
              onRemove={() => removeGroup(group.localId)}
            />
          )
        })}

        <button
          type="button"
          onClick={addGroup}
          className="rounded-xl border border-dashed border-[#4B7312] bg-white px-4 py-3 text-sm font-semibold text-[#4B7312] hover:bg-[#4B7312] hover:text-white"
        >
          + Ajouter un autre bon de réception
        </button>

        <section className="sticky bottom-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          {(submitError || receiptVoucherError) && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {submitError || receiptVoucherError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {selectedRequestItemIds.size} article
              {selectedRequestItemIds.size > 1 ? "s" : ""} sur{" "}
              {requestItems.length} réparti
              {selectedRequestItemIds.size > 1 ? "s" : ""} dans{" "}
              {activeGroups.length} bon
              {activeGroups.length > 1 ? "s" : ""} de réception.
            </p>

            <button
              type="button"
              disabled={activeGroups.length === 0 || loadingReceiptVoucher}
              onClick={handleSubmit}
              className="cursor-pointer rounded-xl bg-[#4B7312] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingReceiptVoucher
                ? "Création..."
                : "Créer le ou les bons de réception"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ReceiptVouchersCreation
