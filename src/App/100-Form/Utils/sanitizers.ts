import {
  MAX_LINK_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PRICE,
  MAX_QUANTITY,
} from "./formConstants"

export const stripUnsafeText = (value: string, maxLength: number) =>
  Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0)

      return code > 31 && code !== 127
    })
    .join("")
    .replace(/[<>]/g, "")
    .slice(0, maxLength)

export const sanitizeName = (value: string) =>
  stripUnsafeText(value, MAX_NAME_LENGTH).replace(
    /[^\p{L}\p{M} .,'-]/gu,
    "",
  )

export const sanitizeQuantity = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 4)

  if (!digitsOnly) return ""

  return String(Math.min(Number(digitsOnly), MAX_QUANTITY))
}

export const sanitizePrice = (value: string) => {
  const normalizedValue = value.replace(",", ".").replace(/[^\d.]/g, "")
  const [whole = "", ...decimalParts] = normalizedValue.split(".")
  const decimal = decimalParts.join("").slice(0, 2)
  const wholeNumber = whole.slice(0, 6)

  return decimalParts.length > 0 ? `${wholeNumber}.${decimal}` : wholeNumber
}

export const sanitizeUrl = (value: string) =>
  stripUnsafeText(value.trim(), MAX_LINK_LENGTH).replace(/\s/g, "")

export const isValidHttpUrl = (value: string) => {
  if (!value) return true

  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const isValidPrice = (value: number | null) =>
  value === null || (Number.isFinite(value) && value >= 0 && value <= MAX_PRICE)
