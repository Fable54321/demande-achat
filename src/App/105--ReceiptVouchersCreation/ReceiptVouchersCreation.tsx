import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useReceiptVoucher, type ReceiptVoucher } from "../../Contexts/ReceiptVoucherContext"
import { useBuying, type Supplier } from "../../Contexts/BuyingContext"
import SuccesOverlay from "../SuccesOverlay"
import vegibecLogo from "../../assets/vegibec.png"
import {
  buildSupplierAddressSnapshot,
  DEFAULT_SUPPLIER_COUNTRY,
  DEFAULT_SUPPLIER_PROVINCE,
  parseSupplierAddressSnapshot,
} from "../103--BuyingProcess/Utils/buyingHelpers"

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
  pickupName: string
  pickupFrom: string
  pickupStreet: string
  pickupCity: string
  pickupPostalCode: string
  pickupProvince: string
  pickupCountry: string
  pickupPhone: string
  shippedTo: string
  buyerName: string
  buyerEmail: string
  orderedAt: string
  receivedAt: string
  deliveryMethod: string
  receiptNote: string
  items: ReceiptVoucherItemForm[]
}

type RequestItemWithReceiptDetails = {
  id: number
  purchase_order_id?: number | string | null
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
  remaining_quantity?: number | string | null
  already_received_quantity?: number | string | null
  supplier_id?: number | string | null
  supplier_name?: string | null
  supplier?: string | null
  supplier_address_snapshot?: string | null
  supplier_phone?: string | null
  ordered_at?: string | null
  purchased_at?: string | null
  delivery_method?: string | null
  shipping_address_snapshot?: string | null
}

type ReceiptVoucherDefaultItem = Omit<
  Partial<RequestItemWithReceiptDetails>,
  "id"
> & {
  purchase_request_item_id: number | string
  purchase_order_item_id: number | string
  purchase_order_id: number | string
  purchase_order_reference?: string | null
  received_quantity?: number | string | null
}

type ReceiptVoucherDefaultSupplier = {
  purchase_order_id: number | string
  purchase_order_reference?: string | null
  supplier_id?: number | string | null
  supplier?: string | null
  supplier_name?: string | null
  supplier_address_snapshot?: string | null
  supplier_phone?: string | null
  delivery_method?: string | null
  supplier_reference?: string | null
}

type PurchaseOrderItemSnapshot = {
  id?: number | string | null
  purchase_order_id?: number | string | null
  purchase_request_item_id?: number | string | null
  purchase_order_reference?: string | null
  item_code?: string | null
  item_description?: string | null
  ordered_quantity?: number | string | null
  ordered_unit?: string | null
  remaining_quantity?: number | string | null
  already_received_quantity?: number | string | null
  supplier_id?: number | string | null
  supplier_name?: string | null
  supplier?: string | null
  supplier_address_snapshot?: string | null
  supplier_phone?: string | null
  ordered_at?: string | null
  purchased_at?: string | null
  delivery_method?: string | null
  shipping_address_snapshot?: string | null
  purchase_order?: PurchaseOrderSnapshot | null
}

type PurchaseOrderSnapshot = {
  id?: number | string | null
  supplier_id?: number | string | null
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
  items?: PurchaseOrderItemSnapshot[] | null
}

type ReceiptVoucherRequestWithPurchaseOrder = {
  purchase_order?: PurchaseOrderSnapshot | null
  purchase_orders?: PurchaseOrderSnapshot[] | null
  purchase_order_items?: PurchaseOrderItemSnapshot[] | null
  receipt_voucher_defaults?: {
    suppliers?: ReceiptVoucherDefaultSupplier[] | null
    items?: ReceiptVoucherDefaultItem[] | null
  } | null
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
  selectedItemIdsInOtherGroups: Set<string>
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

const DEFAULT_RECEIVED_BY_NAME = "Ricardo Molière"
const DEFAULT_RECEIVED_BY_EMAIL = "achats@vegibec.com"

const receiptVoucherFieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4B7312] focus:ring-4 focus:ring-[#96c61c]/20"

const receiptVoucherTableFieldClass =
  "rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4B7312] focus:ring-4 focus:ring-[#96c61c]/20"

const deliveryMethodOptions = ["Ramassé", "Livré"] as const

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

const toOptionalNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

const toIdKey = (value: number | string | null | undefined) => {
  const number = toOptionalNumber(value)

  return number === null ? null : String(number)
}

const getSupplierAddressFields = (supplier: Supplier) => {
  const parsedAddress = parseSupplierAddressSnapshot(
    supplier.address_snapshot,
    supplier.name,
  )

  return {
    pickupStreet: parsedAddress.street || supplier.address_snapshot || "",
    pickupCity: parsedAddress.city || supplier.city || "",
    pickupPostalCode: parsedAddress.postalCode || supplier.postal_code || "",
    pickupProvince:
      parsedAddress.province || supplier.province || DEFAULT_SUPPLIER_PROVINCE,
    pickupCountry:
      parsedAddress.country || supplier.country || DEFAULT_SUPPLIER_COUNTRY,
  }
}

const buildGroupPickupFromSnapshot = (
  group: Pick<
    ReceiptVoucherGroupForm,
    | "pickupName"
    | "pickupStreet"
    | "pickupCity"
    | "pickupPostalCode"
    | "pickupProvince"
    | "pickupCountry"
  >,
) =>
  buildSupplierAddressSnapshot({
    name: group.pickupName,
    street: group.pickupStreet,
    city: group.pickupCity,
    postalCode: group.pickupPostalCode,
    province: group.pickupProvince,
    country: group.pickupCountry,
  })

const getItemPurchaseOrder = (item: RequestItemWithReceiptDetails) =>
  item.purchase_order ?? item.purchase_order_item?.purchase_order ?? null

const getPurchaseOrderId = (purchaseOrder: PurchaseOrderSnapshot | null) =>
  toIdKey(purchaseOrder?.id)

const getPurchaseOrderItemRequestItemId = (
  purchaseOrderItem: PurchaseOrderItemSnapshot,
) => toOptionalNumber(purchaseOrderItem.purchase_request_item_id)

const getPurchaseOrderItemOrderId = (
  purchaseOrderItem?: PurchaseOrderItemSnapshot | null,
) => toIdKey(purchaseOrderItem?.purchase_order_id ?? purchaseOrderItem?.purchase_order?.id)

const createRequestItemFromReceiptDefault = (
  item: ReceiptVoucherDefaultItem,
): RequestItemWithReceiptDetails => {
  const purchaseRequestItemId = toOptionalNumber(item.purchase_request_item_id) ?? 0
  const orderedQuantity = item.ordered_quantity ?? item.quantity ?? 0

  return {
    id: purchaseRequestItemId,
    purchase_order_id: item.purchase_order_id,
    purchase_order_item_id:
      toOptionalNumber(item.purchase_order_item_id) ?? null,
    item_code: item.item_code ?? item.code ?? null,
    code: item.code ?? item.item_code ?? null,
    description: item.item_description ?? item.description ?? "",
    item_description: item.item_description ?? item.description ?? null,
    quantity: Number(orderedQuantity) || 0,
    ordered_quantity: orderedQuantity,
    quantity_format: item.ordered_unit ?? item.quantity_format ?? null,
    ordered_unit: item.ordered_unit ?? item.quantity_format ?? null,
    remaining_quantity: item.remaining_quantity ?? item.received_quantity ?? null,
    already_received_quantity: item.already_received_quantity ?? null,
    supplier_id: item.supplier_id,
    supplier_name: item.supplier_name,
    supplier: item.supplier,
    supplier_address_snapshot: item.supplier_address_snapshot,
    supplier_phone: item.supplier_phone,
    delivery_method: item.delivery_method,
    shipping_address_snapshot: item.shipping_address_snapshot,
    purchase_order_item: {
      id: item.purchase_order_item_id,
      purchase_order_id: item.purchase_order_id,
      purchase_request_item_id: item.purchase_request_item_id,
      item_code: item.item_code ?? item.code ?? null,
      item_description: item.item_description ?? item.description ?? null,
      ordered_quantity: orderedQuantity,
      ordered_unit: item.ordered_unit ?? item.quantity_format ?? null,
      remaining_quantity: item.remaining_quantity ?? item.received_quantity ?? null,
      already_received_quantity: item.already_received_quantity ?? null,
      supplier_id: item.supplier_id,
      supplier_name: item.supplier_name,
      supplier: item.supplier,
      supplier_address_snapshot: item.supplier_address_snapshot,
      supplier_phone: item.supplier_phone,
      delivery_method: item.delivery_method,
      shipping_address_snapshot: item.shipping_address_snapshot,
    },
  }
}

const getReceiptVoucherRequestItems = (
  request: ReceiptVoucherRequestWithPurchaseOrder,
) => {
  const defaultItems = request.receipt_voucher_defaults?.items ?? []

  return defaultItems.length > 0
    ? defaultItems.map(createRequestItemFromReceiptDefault)
    : request.items ?? []
}

const getRequestItemPurchaseOrderId = (item: RequestItemWithReceiptDetails) =>
  getPurchaseOrderId(getItemPurchaseOrder(item)) ??
  getPurchaseOrderItemOrderId(item.purchase_order_item) ??
  toIdKey(item.purchase_order_id)

const isRequestItemInReceiptGroup = (
  item: RequestItemWithReceiptDetails,
  group: ReceiptVoucherGroupForm,
) => {
  if (group.purchaseOrderItemsByRequestItemId[item.id]) {
    return true
  }

  const groupPurchaseOrderId = group.purchase_order_id
    ? String(group.purchase_order_id)
    : null
  const itemPurchaseOrderId = getRequestItemPurchaseOrderId(item)

  if (groupPurchaseOrderId) {
    return itemPurchaseOrderId === groupPurchaseOrderId
  }

  return !itemPurchaseOrderId
}

const createPurchaseOrderFromItem = (
  item: RequestItemWithReceiptDetails,
): PurchaseOrderSnapshot | null => {
  const nestedPurchaseOrder = getItemPurchaseOrder(item)
  if (nestedPurchaseOrder) return nestedPurchaseOrder

  const purchaseOrderItem = item.purchase_order_item
  const purchaseOrderId = toIdKey(
    item.purchase_order_id ?? purchaseOrderItem?.purchase_order_id,
  )

  if (!purchaseOrderId) return null

  return {
    id: purchaseOrderId,
    supplier_id: item.supplier_id ?? purchaseOrderItem?.supplier_id,
    supplier_name: item.supplier_name ?? purchaseOrderItem?.supplier_name,
    supplier: item.supplier ?? purchaseOrderItem?.supplier,
    supplier_address_snapshot:
      item.supplier_address_snapshot ??
      purchaseOrderItem?.supplier_address_snapshot,
    supplier_phone: item.supplier_phone ?? purchaseOrderItem?.supplier_phone,
    ordered_at: item.ordered_at ?? purchaseOrderItem?.ordered_at,
    purchased_at: item.purchased_at ?? purchaseOrderItem?.purchased_at,
    delivery_method: item.delivery_method ?? purchaseOrderItem?.delivery_method,
    shipping_address_snapshot:
      item.shipping_address_snapshot ??
      purchaseOrderItem?.shipping_address_snapshot,
  }
}

const createPurchaseOrderFromPurchaseOrderItem = (
  purchaseOrderItem: PurchaseOrderItemSnapshot,
): PurchaseOrderSnapshot | null => {
  if (purchaseOrderItem.purchase_order) return purchaseOrderItem.purchase_order

  const purchaseOrderId = toIdKey(purchaseOrderItem.purchase_order_id)
  if (!purchaseOrderId) return null

  return {
    id: purchaseOrderId,
    supplier_id: purchaseOrderItem.supplier_id,
    supplier_name: purchaseOrderItem.supplier_name,
    supplier: purchaseOrderItem.supplier,
    supplier_address_snapshot: purchaseOrderItem.supplier_address_snapshot,
    supplier_phone: purchaseOrderItem.supplier_phone,
    ordered_at: purchaseOrderItem.ordered_at,
    purchased_at: purchaseOrderItem.purchased_at,
    delivery_method: purchaseOrderItem.delivery_method,
    shipping_address_snapshot: purchaseOrderItem.shipping_address_snapshot,
    purchase_order_items: [purchaseOrderItem],
  }
}

const createPurchaseOrderFromReceiptDefaultSupplier = (
  supplier: ReceiptVoucherDefaultSupplier,
): PurchaseOrderSnapshot | null => {
  const purchaseOrderId = toIdKey(supplier.purchase_order_id)
  if (!purchaseOrderId) return null

  return {
    id: purchaseOrderId,
    supplier_id: supplier.supplier_id,
    supplier_name: supplier.supplier_name,
    supplier: supplier.supplier,
    supplier_address_snapshot: supplier.supplier_address_snapshot,
    supplier_phone: supplier.supplier_phone,
    delivery_method: supplier.delivery_method,
  }
}

const mergePurchaseOrderDefaults = (
  current: PurchaseOrderSnapshot,
  incoming: PurchaseOrderSnapshot,
): PurchaseOrderSnapshot => ({
  ...incoming,
  ...current,
  id: current.id ?? incoming.id,
  supplier_id: current.supplier_id ?? incoming.supplier_id,
  supplier_name: current.supplier_name ?? incoming.supplier_name,
  supplier: current.supplier ?? incoming.supplier,
  supplier_address_snapshot:
    current.supplier_address_snapshot ?? incoming.supplier_address_snapshot,
  supplier_phone: current.supplier_phone ?? incoming.supplier_phone,
  ordered_at: current.ordered_at ?? incoming.ordered_at,
  purchased_at: current.purchased_at ?? incoming.purchased_at,
  delivery_method: current.delivery_method ?? incoming.delivery_method,
  shipping_address_snapshot:
    current.shipping_address_snapshot ?? incoming.shipping_address_snapshot,
  purchase_order_items: [
    ...(incoming.purchase_order_items ?? []),
    ...(current.purchase_order_items ?? []),
  ],
})

const getKnownPurchaseOrders = (
  request: ReceiptVoucherRequestWithPurchaseOrder,
) => {
  const explicitPurchaseOrders = request.purchase_orders?.length
    ? request.purchase_orders
    : request.purchase_order
      ? [request.purchase_order]
      : []

  const purchaseOrdersById = new Map<number, PurchaseOrderSnapshot>()

  const addPurchaseOrder = (purchaseOrder: PurchaseOrderSnapshot | null) => {
    const purchaseOrderId = getPurchaseOrderId(purchaseOrder)
    if (!purchaseOrder || !purchaseOrderId) return

    const existing = purchaseOrdersById.get(Number(purchaseOrderId))
    purchaseOrdersById.set(
      Number(purchaseOrderId),
      existing
        ? mergePurchaseOrderDefaults(existing, purchaseOrder)
        : purchaseOrder,
    )
  }

  explicitPurchaseOrders.forEach(addPurchaseOrder)

  request.receipt_voucher_defaults?.suppliers?.forEach((supplier) => {
    addPurchaseOrder(createPurchaseOrderFromReceiptDefaultSupplier(supplier))
  })

  request.purchase_order_items?.forEach((purchaseOrderItem) => {
    addPurchaseOrder(createPurchaseOrderFromPurchaseOrderItem(purchaseOrderItem))
  })

  request.items?.forEach((item) => {
    addPurchaseOrder(createPurchaseOrderFromItem(item))
  })

  return [...purchaseOrdersById.values()]
}

const getSupplierFromPurchaseOrder = (
  purchaseOrder: PurchaseOrderSnapshot | null,
  suppliers: Supplier[],
) => {
  const supplierId = toOptionalNumber(purchaseOrder?.supplier_id)
  if (!supplierId) return null

  return (
    suppliers.find((supplier) => supplier.id === supplierId) ??
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
  const receivedQuantity =
    purchaseOrderItem?.remaining_quantity ??
    item.remaining_quantity ??
    quantity

  return {
    purchase_request_item_id: item.id,
    purchase_order_item_id:
      toOptionalNumber(item.purchase_order_item_id ?? purchaseOrderItem?.id),
    code: purchaseOrderItem?.item_code ?? item.item_code ?? item.code ?? "",
    description:
      purchaseOrderItem?.item_description ??
      item.item_description ??
      item.description ??
      "",
    quantity: String(quantity),
    quantity_format:
      purchaseOrderItem?.ordered_unit ?? item.ordered_unit ?? item.quantity_format ?? "",
    received_quantity: String(receivedQuantity),
    comment: "",
  }
}

const getReceiptItemKey = (item: ReceiptVoucherItemForm) =>
  item.purchase_order_item_id
    ? `purchase-order-item:${item.purchase_order_item_id}`
    : `purchase-request-item:${item.purchase_request_item_id}`

const getRequestItemSelectionKey = (
  item: RequestItemWithReceiptDetails,
  purchaseOrderItem?: PurchaseOrderItemSnapshot | null,
) => {
  const purchaseOrderItemId = toOptionalNumber(
    item.purchase_order_item_id ?? purchaseOrderItem?.id,
  )

  return purchaseOrderItemId
    ? `purchase-order-item:${purchaseOrderItemId}`
    : `purchase-request-item:${item.id}`
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
  const pickupName =
    purchaseOrder?.supplier_name ??
    purchaseOrder?.supplier ??
    purchaseOrderSupplier?.name ??
    ""
  const parsedPurchaseOrderAddress = parseSupplierAddressSnapshot(
    purchaseOrder?.supplier_address_snapshot,
    pickupName,
  )
  const supplierAddressFields = purchaseOrderSupplier
    ? getSupplierAddressFields(purchaseOrderSupplier)
    : null
  const pickupStreet =
    parsedPurchaseOrderAddress.street || supplierAddressFields?.pickupStreet || ""
  const pickupCity =
    parsedPurchaseOrderAddress.city || supplierAddressFields?.pickupCity || ""
  const pickupPostalCode =
    parsedPurchaseOrderAddress.postalCode ||
    supplierAddressFields?.pickupPostalCode ||
    ""
  const pickupProvince =
    parsedPurchaseOrderAddress.province ||
    supplierAddressFields?.pickupProvince ||
    DEFAULT_SUPPLIER_PROVINCE
  const pickupCountry =
    parsedPurchaseOrderAddress.country ||
    supplierAddressFields?.pickupCountry ||
    DEFAULT_SUPPLIER_COUNTRY

  return {
    localId: crypto.randomUUID(),
    purchase_order_id: toOptionalNumber(purchaseOrder?.id),
    purchaseOrderItemsByRequestItemId: Object.fromEntries(
      purchaseOrderItemsByRequestItemId,
    ),
    pickupSupplierId: purchaseOrder?.supplier_id ? String(purchaseOrder.supplier_id) : "",
    pickupName,
    pickupFrom: buildSupplierAddressSnapshot({
      name: pickupName,
      street: pickupStreet,
      city: pickupCity,
      postalCode: pickupPostalCode,
      province: pickupProvince,
      country: pickupCountry,
    }),
    pickupStreet,
    pickupCity,
    pickupPostalCode,
    pickupProvince,
    pickupCountry,
    pickupPhone:
      purchaseOrder?.supplier_phone ??
      purchaseOrderSupplier?.phone ??
      purchaseOrderSupplier?.supplier_phone ??
      "",
    shippedTo: purchaseOrder?.shipping_address_snapshot || VEGIBEC_ADDRESS,
    buyerName: DEFAULT_RECEIVED_BY_NAME,
    buyerEmail: DEFAULT_RECEIVED_BY_EMAIL,
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
  pickupName: "",
  pickupFrom: "",
  pickupStreet: "",
  pickupCity: "",
  pickupPostalCode: "",
  pickupProvince: DEFAULT_SUPPLIER_PROVINCE,
  pickupCountry: DEFAULT_SUPPLIER_COUNTRY,
  pickupPhone: "",
  shippedTo: VEGIBEC_ADDRESS,
  buyerName: DEFAULT_RECEIVED_BY_NAME,
  buyerEmail: DEFAULT_RECEIVED_BY_EMAIL,
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

    const purchaseOrderId = getPurchaseOrderId(purchaseOrder)
    const allPurchaseOrderItems = [
      ...(purchaseOrder.items ?? []),
      ...(purchaseOrder.purchase_order_items ?? []),
      ...(request.purchase_order_items ?? []).filter(
        (purchaseOrderItem) =>
          getPurchaseOrderItemOrderId(purchaseOrderItem) === purchaseOrderId,
      ),
    ]

    allPurchaseOrderItems.forEach((purchaseOrderItem) => {
      const purchaseRequestItemId =
        getPurchaseOrderItemRequestItemId(purchaseOrderItem)

      if (purchaseRequestItemId) {
        purchaseOrderItemsByRequestItemId.set(
          purchaseRequestItemId,
          purchaseOrderItem,
        )
      }
    })

    const itemsForPurchaseOrder = requestItems.filter((item) => {
      const itemPurchaseOrder = getItemPurchaseOrder(item)
      const itemPurchaseOrderId =
        getPurchaseOrderId(itemPurchaseOrder) ??
        getPurchaseOrderItemOrderId(item.purchase_order_item) ??
        toIdKey(item.purchase_order_id)

      if (purchaseOrderItemsByRequestItemId.has(item.id)) {
        return true
      }

      if (!itemPurchaseOrderId) {
        return purchaseOrders.length === 1
      }

      return itemPurchaseOrderId === purchaseOrderId
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
      group.items.map(getReceiptItemKey),
    ),
  )
  const ungroupedItems = requestItems.filter((item) => {
    const itemKey = getRequestItemSelectionKey(item, item.purchase_order_item)

    return !groupedItemIds.has(itemKey)
  })

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
    () => new Set(group.items.map(getReceiptItemKey)),
    [group.items],
  )

  const updatePickupAddress = (
    update: Partial<
      Pick<
        ReceiptVoucherGroupForm,
        | "pickupName"
        | "pickupStreet"
        | "pickupCity"
        | "pickupPostalCode"
        | "pickupProvince"
        | "pickupCountry"
      >
    >,
  ) => {
    const nextGroup = {
      ...group,
      ...update,
    }

    onChange({
      ...nextGroup,
      pickupFrom: buildGroupPickupFromSnapshot(nextGroup),
    })
  }

  const selectPickupSupplier = (supplierId: string) => {
    if (!supplierId) {
      onChange({
        ...group,
        pickupSupplierId: "",
        pickupName: "",
        pickupFrom: "",
        pickupStreet: "",
        pickupCity: "",
        pickupPostalCode: "",
        pickupProvince: DEFAULT_SUPPLIER_PROVINCE,
        pickupCountry: DEFAULT_SUPPLIER_COUNTRY,
        pickupPhone: "",
      })
      return
    }

    const supplier = suppliers.find(
      (currentSupplier) => String(currentSupplier.id) === supplierId,
    )

    if (!supplier) return
    const supplierAddressFields = getSupplierAddressFields(supplier)

    onChange({
      ...group,
      pickupSupplierId: supplierId,
      pickupName: supplier.name,
      ...supplierAddressFields,
      pickupFrom: buildSupplierAddressSnapshot({
        name: supplier.name,
        street: supplierAddressFields.pickupStreet,
        city: supplierAddressFields.pickupCity,
        postalCode: supplierAddressFields.pickupPostalCode,
        province: supplierAddressFields.pickupProvince,
        country: supplierAddressFields.pickupCountry,
      }),
      pickupPhone: supplier.phone ?? supplier.supplier_phone ?? "",
    })
  }

  const toggleItem = (requestItem: RequestItemWithReceiptDetails) => {
    const purchaseOrderItem = group.purchaseOrderItemsByRequestItemId[requestItem.id]
    const requestItemKey = getRequestItemSelectionKey(
      requestItem,
      purchaseOrderItem,
    )

    if (selectedItemIds.has(requestItemKey)) {
      onChange({
        ...group,
        items: group.items.filter(
          (item) => getReceiptItemKey(item) !== requestItemKey,
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
          purchaseOrderItem,
        ),
      ],
    })
  }

  const updateItem = (
    itemKey: string,
    update: Partial<ReceiptVoucherItemForm>,
  ) => {
    onChange({
      ...group,
      items: group.items.map((item) =>
        getReceiptItemKey(item) === itemKey
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
            className={`mt-4 w-full ${receiptVoucherFieldClass}`}
          >
            <option value="">Sélectionner un fournisseur</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <input
            value={group.pickupName}
            onChange={(event) =>
              updatePickupAddress({ pickupName: event.target.value })
            }
            placeholder="Nom du fournisseur"
            className={`mt-3 w-full ${receiptVoucherFieldClass}`}
          />

          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                No et rue
              </span>
              <input
                value={group.pickupStreet}
                onChange={(event) =>
                  updatePickupAddress({ pickupStreet: event.target.value })
                }
                className={`mt-2 w-full ${receiptVoucherFieldClass}`}
              />
            </label>

            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                Ville
              </span>
              <input
                value={group.pickupCity}
                onChange={(event) =>
                  updatePickupAddress({ pickupCity: event.target.value })
                }
                className={`mt-2 w-full ${receiptVoucherFieldClass}`}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Code postal
                </span>
                <input
                  value={group.pickupPostalCode}
                  onChange={(event) =>
                    updatePickupAddress({
                      pickupPostalCode: event.target.value,
                    })
                  }
                  className={`mt-2 w-full ${receiptVoucherFieldClass}`}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Province
                </span>
                <input
                  value={group.pickupProvince}
                  onChange={(event) =>
                    updatePickupAddress({ pickupProvince: event.target.value })
                  }
                  className={`mt-2 w-full ${receiptVoucherFieldClass}`}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                Pays
              </span>
              <input
                value={group.pickupCountry}
                onChange={(event) =>
                  updatePickupAddress({ pickupCountry: event.target.value })
                }
                className={`mt-2 w-full ${receiptVoucherFieldClass}`}
              />
            </label>
          </div>

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
              className={`mt-2 w-full ${receiptVoucherFieldClass}`}
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
            className={`mt-4 min-h-28 w-full resize-none leading-6 ${receiptVoucherFieldClass}`}
          />

          <div className="mt-4 border-t border-[#d2dfd2] pt-4">
            <h3 className="text-lg font-black text-[#1f6b24]">Acheteur</h3>

            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Nom
                </span>
                <input
                  value={group.buyerName}
                  onChange={(event) =>
                    onChange({ ...group, buyerName: event.target.value })
                  }
                  className={`mt-2 w-full ${receiptVoucherFieldClass}`}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Courriel
                </span>
                <input
                  type="email"
                  value={group.buyerEmail}
                  onChange={(event) =>
                    onChange({ ...group, buyerEmail: event.target.value })
                  }
                  className={`mt-2 w-full ${receiptVoucherFieldClass}`}
                />
              </label>
            </div>
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
              className={`mt-4 w-full ${receiptVoucherFieldClass}`}
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
              className={`mt-4 w-full ${receiptVoucherFieldClass}`}
            />
          </label>

          <label className="mt-6 block">
            <span className="text-lg font-black text-[#1f6b24]">
              Méthode de livraison
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {deliveryMethodOptions.map((deliveryMethod) => {
                const isSelected = group.deliveryMethod === deliveryMethod

                return (
                  <button
                    key={deliveryMethod}
                    type="button"
                    onClick={() =>
                      onChange({ ...group, deliveryMethod: deliveryMethod })
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      isSelected
                        ? "border-[#4B7312] bg-[#4B7312] text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-[#4B7312] hover:bg-tertiary"
                    }`}
                  >
                    {deliveryMethod}
                  </button>
                )
              })}
            </div>
            <input
              value={group.deliveryMethod}
              onChange={(event) =>
                onChange({ ...group, deliveryMethod: event.target.value })
              }
              className={`mt-4 w-full ${receiptVoucherFieldClass}`}
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
            const purchaseOrderItem =
              group.purchaseOrderItemsByRequestItemId[requestItem.id]
            const requestItemKey = getRequestItemSelectionKey(
              requestItem,
              purchaseOrderItem,
            )
            const selectedInOtherGroup = selectedItemIdsInOtherGroups.has(
              requestItemKey,
            )
            const selected = selectedItemIds.has(requestItemKey)
            const requestItemPreview = createItemFromRequest(
              requestItem,
              purchaseOrderItem,
            )

            return (
              <label
                key={requestItemKey}
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
                    {requestItemPreview.description}
                  </p>
                  <p className="text-sm text-slate-600">
                    Quantité commandée: {requestItemPreview.quantity}{" "}
                    {requestItemPreview.quantity_format}
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
            {group.items.map((item) => {
              const itemKey = getReceiptItemKey(item)

              return (
              <tr key={itemKey} className="align-top">
                <td className="border border-[#d2dfd2] p-2">
                  <input
                    value={item.code}
                    onChange={(event) =>
                      updateItem(itemKey, {
                        code: event.target.value,
                      })
                    }
                    className={`w-full ${receiptVoucherTableFieldClass}`}
                  />
                </td>

                <td className="border border-[#d2dfd2] p-2">
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      updateItem(itemKey, {
                        description: event.target.value,
                      })
                    }
                    className={`min-h-16 w-full resize-none ${receiptVoucherTableFieldClass}`}
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
                        updateItem(itemKey, {
                          quantity: event.target.value,
                        })
                      }
                      className={`min-w-0 flex-1 ${receiptVoucherTableFieldClass}`}
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
                      updateItem(itemKey, {
                        received_quantity: event.target.value,
                      })
                    }
                    className={`w-full ${receiptVoucherTableFieldClass}`}
                  />
                </td>

                <td className="border border-[#d2dfd2] p-2">
                  <textarea
                    value={item.comment}
                    onChange={(event) =>
                      updateItem(itemKey, {
                        comment: event.target.value,
                      })
                    }
                    className={`min-h-16 w-full resize-none ${receiptVoucherTableFieldClass}`}
                  />
                </td>
              </tr>
              )
            })}

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
            className={`mt-2 min-h-20 w-full ${receiptVoucherFieldClass}`}
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
      const items = getReceiptVoucherRequestItems(receiptRequest)
      const normalizedReceiptRequest = {
        ...receiptRequest,
        items,
      }

      setRequestItems(items)
      setGroups(createGroupsFromRequest(normalizedReceiptRequest, loadedSuppliers))
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
          group.items.map(getReceiptItemKey),
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

    const mixedPurchaseOrderGroup = activeGroups.find((group) =>
      group.items.some((item) => {
        const requestItem = requestItems.find(
          (currentItem) => currentItem.id === item.purchase_request_item_id,
        )

        return requestItem ? !isRequestItemInReceiptGroup(requestItem, group) : false
      }),
    )

    if (mixedPurchaseOrderGroup) {
      setSubmitError(
        "Les articles de bons de commande differents doivent rester dans des bons de reception separes.",
      )
      return
    }

    const createdVouchers: ReceiptVoucher[] = []

    for (const group of activeGroups) {
      const result = await createReceiptVoucher(Number(id), token, {
        purchase_request_id: receiptVoucherRequest.id,
        supplier_id: toOptionalNumber(group.pickupSupplierId),
        supplier_name: toNullableText(group.pickupName),
        supplier_address_snapshot: toNullableText(group.pickupFrom),
        supplier_phone: toNullableText(group.pickupPhone),
        received_by_name: group.buyerName.trim() || DEFAULT_RECEIVED_BY_NAME,
        received_by_email: group.buyerEmail.trim() || DEFAULT_RECEIVED_BY_EMAIL,
        received_at: group.receivedAt || null,
        delivery_method: toNullableText(group.deliveryMethod),
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
          const requestItemsForGroup = requestItems.filter((requestItem) =>
            isRequestItemInReceiptGroup(requestItem, group),
          )
          const selectedItemIdsInOtherGroups = new Set(
            groups
              .filter((currentGroup) => currentGroup.localId !== group.localId)
              .flatMap((currentGroup) =>
                currentGroup.items.map(getReceiptItemKey),
              ),
          )

          return (
            <ReceiptVoucherDocument
              key={group.localId}
              group={group}
              groupIndex={index}
              groupsCount={groups.length}
              suppliers={suppliers}
              requestItems={requestItemsForGroup}
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
