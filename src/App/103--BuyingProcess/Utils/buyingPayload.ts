import type { CreatePurchaseOrderPayload, PurchaseMode } from "../../../Contexts/BuyingContext"
import type { PurchaseOrderGroupForm } from "./buyingTypes"
import {
  toNullableMoney,
  toNullableText,
  toRoundedMoney,
  toRoundedNumber,
} from "./buyingHelpers"

const getRoundedLineTotal = (quantityValue: string, unitPriceValue: string) => {
  const quantity = toRoundedNumber(quantityValue)
  const unitPrice = toNullableMoney(unitPriceValue)

  if (quantity === null || unitPrice === null) return null

  return toRoundedMoney(quantity * unitPrice)
}

export const buildCreatePurchaseOrderPayload = (
  group: PurchaseOrderGroupForm,
  purchaseMode: PurchaseMode,
): CreatePurchaseOrderPayload => ({
  purchase_mode: purchaseMode,

  supplier_id: group.supplier_id,
  supplier_name: toNullableText(group.supplier_name),
  supplier_address_snapshot: toNullableText(group.supplier_address_snapshot),
  supplier_phone: toNullableText(group.supplier_phone),

  buyer_name: toNullableText(group.buyer_name),
  buyer_email: toNullableText(group.buyer_email),

  requested_delivery_date: group.requested_delivery_date || null,
  delivery_method: toNullableText(group.delivery_method),
  shipping_address_snapshot: toNullableText(group.shipping_address_snapshot),

  purchase_note: toNullableText(group.purchase_note),

  purchased_by_user_id: 1, // temporary
  ordered_at: group.ordered_at || null,
  currency_code: group.currency_code || "CAD",

  items: group.items.map((item) => ({
    purchase_request_item_id: item.purchase_request_item_id,
    ordered_quantity: toRoundedNumber(item.ordered_quantity) ?? 0,
    final_unit_price: toNullableMoney(item.final_unit_price),
    final_total_price: getRoundedLineTotal(
      item.ordered_quantity,
      item.final_unit_price,
    ),
    item_code: toNullableText(item.item_code),
    item_description: toNullableText(item.item_description),
    ordered_unit: toNullableText(item.ordered_unit),
  })),
})
