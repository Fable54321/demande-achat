import type { PurchaseMode } from "../../../Contexts/BuyingContext"
import type { PurchaseRequestItem } from "../../../Contexts/PurchaseRequestContext"

export type PurchaseOrderItemForm = {
  purchase_request_item_id: number
  ordered_quantity: string
  final_unit_price: string
  item_code: string
  item_description: string
  ordered_unit: string
}

export type PurchaseOrderGroupForm = {
  localId: string

  supplier_id: number | null
  supplier_name: string
  supplier_address_snapshot: string
  supplier_address_street: string
  supplier_city: string
  supplier_postal_code: string
  supplier_province: string
  supplier_country: string
  supplier_phone: string

  purchase_note: string

  buyer_name: string
  buyer_email: string

  requested_delivery_date: string
  delivery_method: string
  shipping_address_snapshot: string
  ordered_at: string
  currency_code: string

  items: PurchaseOrderItemForm[]
}

export type BuyingProcessState = {
  purchaseMode: PurchaseMode
  groups: PurchaseOrderGroupForm[]
}

export type RequestItemWithRemaining = PurchaseRequestItem & {
  remaining_quantity?: number
}
