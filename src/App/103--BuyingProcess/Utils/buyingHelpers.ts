import type {
  PurchaseOrderGroupForm,
  PurchaseOrderItemForm,
} from "./buyingTypes"
import type { PurchaseRequestItem } from "../../../Contexts/PurchaseRequestContext"
import { MAX_QUANTITY_FORMAT_LENGTH } from "../../100-Form/Utils/formConstants"

export const createEmptyGroup = (): PurchaseOrderGroupForm => ({
  localId: crypto.randomUUID(),

  supplier_id: null,
  supplier_name: "",
  supplier_address_snapshot: "",
  supplier_phone: "",

  purchase_note: "",

  buyer_name: "",
  buyer_email: "",

  requested_delivery_date: "",
  delivery_method: "Livré",
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
  ordered_unit: (item.quantity_format ?? "").slice(0, MAX_QUANTITY_FORMAT_LENGTH),
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
