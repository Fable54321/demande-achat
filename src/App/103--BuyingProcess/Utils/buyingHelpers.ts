import type {
  PurchaseOrderGroupForm,
  PurchaseOrderItemForm,
} from "./buyingTypes"
import type { PurchaseRequestItem } from "../../../Contexts/PurchaseRequestContext"

export const createEmptyGroup = (): PurchaseOrderGroupForm => ({
  localId: crypto.randomUUID(),

  supplier_id: null,
  supplier_name: "",
  supplier_address_snapshot: "",
  supplier_phone: "",

  supplier_reference: "",
  purchase_note: "",

  buyer_name: "",
  buyer_email: "",

  requested_delivery_date: "",
  received_at: "",
  invoice_number: "",
  delivery_method: "supplier_delivery",
  shipping_address_snapshot: "",
  ordered_at: "",
  currency_code: "CAD",

  items: [],
})

export const createItemFormFromRequestItem = (
  item: PurchaseRequestItem,
): PurchaseOrderItemForm => ({
  purchase_request_item_id: item.id,
  ordered_quantity: String(item.quantity ?? ""),
  final_unit_price: "",
  item_code: "",
  item_description: item.description ?? "",
  ordered_unit: item.quantity_format ?? "",
  number_of_pallets: "",
  location: "",
})

export const toNullableText = (value: string) => {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export const toNullableNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const number = Number(trimmed)
  return Number.isFinite(number) ? number : null
}