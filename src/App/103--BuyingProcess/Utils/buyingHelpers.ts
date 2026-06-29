import type {
  PurchaseOrderGroupForm,
  PurchaseOrderItemForm,
} from "./buyingTypes"
import type { PurchaseRequestItem } from "../../../Contexts/PurchaseRequestContext"
import { MAX_QUANTITY_FORMAT_LENGTH } from "../../100-Form/Utils/formConstants"

export const DEFAULT_BUYER_NAME = "Ricardo Molière"
export const DEFAULT_BUYER_EMAIL = "achats@vegibec.com"

export const DEFAULT_SUPPLIER_PROVINCE = "Québec"
export const DEFAULT_SUPPLIER_COUNTRY = "Canada"

export type SupplierAddressFields = {
  name: string
  street: string
  city: string
  postalCode: string
  province: string
  country: string
}

export const buildSupplierAddressSnapshot = ({
  name,
  street,
  city,
  postalCode,
  province,
  country,
}: SupplierAddressFields) => {
  const streetAndCity = [street, city].filter(Boolean).join(", ")
  const region = [postalCode, province].filter(Boolean).join(" ")
  const regionAndCountry = [region, country].filter(Boolean).join(", ")

  void name

  return [streetAndCity, regionAndCountry]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n")
}

export const parseSupplierAddressSnapshot = (
  snapshot: string | null | undefined,
  supplierName = "",
): Omit<SupplierAddressFields, "name"> => {
  const lines = (snapshot ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines[0] && supplierName && lines[0] === supplierName) {
    lines.shift()
  } else if (lines.length > 3) {
    lines.shift()
  }

  if (lines.length >= 5) {
    return {
      street: lines[0] ?? "",
      city: lines[1] ?? "",
      province: lines[2] || DEFAULT_SUPPLIER_PROVINCE,
      postalCode: lines[3] ?? "",
      country: lines[4] || DEFAULT_SUPPLIER_COUNTRY,
    }
  }

  const hasCombinedStreetAndCity = lines.length <= 2 && lines[0]?.includes(",")
  const [streetFromCombined = "", cityFromCombined = ""] = hasCombinedStreetAndCity
    ? lines[0].split(",").map((part) => part.trim())
    : []
  const street = hasCombinedStreetAndCity
    ? streetFromCombined
    : lines[0] ?? ""
  const city = hasCombinedStreetAndCity
    ? cityFromCombined
    : lines[1] ?? ""
  const regionLine = hasCombinedStreetAndCity ? lines[1] : lines[2]
  const [postalAndProvince = "", country = DEFAULT_SUPPLIER_COUNTRY] =
    (regionLine ?? "").split(",").map((part) => part.trim())
  const postalAndProvinceParts = postalAndProvince.split(/\s+/).filter(Boolean)
  const province =
    postalAndProvinceParts.length > 2
      ? postalAndProvinceParts.slice(2).join(" ")
      : DEFAULT_SUPPLIER_PROVINCE
  const postalCode =
    postalAndProvinceParts.length > 1
      ? postalAndProvinceParts.slice(0, 2).join(" ")
      : postalAndProvinceParts[0] ?? ""

  return {
    street,
    city,
    postalCode,
    province,
    country: country || DEFAULT_SUPPLIER_COUNTRY,
  }
}

export const createEmptyGroup = (): PurchaseOrderGroupForm => ({
  localId: crypto.randomUUID(),

  supplier_id: null,
  supplier_name: "",
  supplier_address_snapshot: "",
  supplier_address_street: "",
  supplier_city: "",
  supplier_postal_code: "",
  supplier_province: DEFAULT_SUPPLIER_PROVINCE,
  supplier_country: DEFAULT_SUPPLIER_COUNTRY,
  supplier_phone: "",

  purchase_note: "",

  buyer_name: DEFAULT_BUYER_NAME,
  buyer_email: DEFAULT_BUYER_EMAIL,

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

  const number = Number(trimmed.replace(",", "."))
  return Number.isFinite(number) ? number : null
}

export const toRoundedNumber = (value: string, decimals = 4) => {
  const number = Number(value.trim().replace(",", "."))

  if (!Number.isFinite(number)) return null

  const factor = 10 ** decimals
  return Math.round((number + Number.EPSILON) * factor) / factor
}

export const toRoundedMoney = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export const toNullableMoney = (value: string) => {
  const number = toRoundedNumber(value, 6)

  return number === null ? null : toRoundedMoney(number)
}
