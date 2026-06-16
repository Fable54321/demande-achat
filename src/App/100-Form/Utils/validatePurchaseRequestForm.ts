import {
  ACCEPTED_IMAGE_TYPES,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MAX_JUSTIFICATION_LENGTH,
  MAX_LINK_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PRICE,
  MAX_QUANTITY,
} from "./formConstants"

import {
  isValidHttpUrl,
  isValidPrice,
  sanitizeName,
  sanitizePrice,
  sanitizeQuantity,
  sanitizeUrl,
  stripUnsafeText,
} from "./sanitizers"

import {
  isValidIsoDate,
  parseDateInputValue,
} from "./dateHelpers"

type ValidatePurchaseRequestFormParams = {
  name: string
  description: string
  justification: string
  quantity: string
  price: string
  link: string
  expectedDate: string
  email: string
  images: File[]
  minExpectedDateObject: Date
}

type ValidatedPurchaseRequestFormValues = {
  name: string
  description: string
  justification: string
  quantity: number
  price: number | null
  link: string
  expectedDate: string
  email: string | null
}

type ValidationResult =
  | {
      ok: true
      values: ValidatedPurchaseRequestFormValues
    }
  | {
      ok: false
      error: string
    }

export function validatePurchaseRequestForm({
  name,
  description,
  justification,
  quantity,
  price,
  link,
  expectedDate,
  email,
  images,
  minExpectedDateObject,
}: ValidatePurchaseRequestFormParams): ValidationResult {
  const safeName = sanitizeName(name).trim().replace(/\s+/g, " ")

  const safeDescription = stripUnsafeText(
    description,
    MAX_DESCRIPTION_LENGTH,
  ).trim()

  const safeJustification = stripUnsafeText(
    justification,
    MAX_JUSTIFICATION_LENGTH,
  ).trim()

  const safeQuantity = Number(sanitizeQuantity(quantity))

  const safePrice = price.trim() ? Number(sanitizePrice(price)) : null

  const safeLink = sanitizeUrl(link).trim()

  const safeExpectedDate = expectedDate.trim()

  const safeEmail = email.trim() ? email.trim().toLowerCase() : null

  if (!safeName) {
    return {
      ok: false,
      error: "Le nom du demandeur est requis.",
    }
  }

  if (safeName.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: `Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`,
    }
  }

  if (!safeDescription) {
    return {
      ok: false,
      error: "La description de la demande est requise.",
    }
  }

  if (safeDescription.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`,
    }
  }

  if (safeJustification.length > MAX_JUSTIFICATION_LENGTH) {
    return {
      ok: false,
      error: `La justification ne peut pas dépasser ${MAX_JUSTIFICATION_LENGTH} caractères.`,
    }
  }

  if (
    !Number.isInteger(safeQuantity) ||
    safeQuantity < 1 ||
    safeQuantity > MAX_QUANTITY
  ) {
    return {
      ok: false,
      error: `La quantité doit être entre 1 et ${MAX_QUANTITY}.`,
    }
  }

  if (safePrice !== null && !isValidPrice(safePrice)) {
    return {
      ok: false,
      error: "Le prix doit être un montant valide.",
    }
  }

  if (safePrice !== null && safePrice > MAX_PRICE) {
    return {
      ok: false,
      error: `Le prix ne peut pas dépasser ${MAX_PRICE} $.`,
    }
  }

  if (safeLink.length > MAX_LINK_LENGTH) {
    return {
      ok: false,
      error: `Le lien ne peut pas dépasser ${MAX_LINK_LENGTH} caractères.`,
    }
  }

  if (safeLink && !isValidHttpUrl(safeLink)) {
    return {
      ok: false,
      error: "Le lien doit commencer par http:// ou https://.",
    }
  }

  if (
    safeExpectedDate &&
    (!isValidIsoDate(safeExpectedDate) ||
      parseDateInputValue(safeExpectedDate) < minExpectedDateObject)
  ) {
    return {
      ok: false,
      error: "La date attendue doit être aujourd'hui ou plus tard.",
    }
  }

  if (
    safeEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)
  ) {
    return {
      ok: false,
      error: "L'adresse courriel est invalide.",
    }
  }

  if (images.length > MAX_IMAGES) {
    return {
      ok: false,
      error: `Vous pouvez ajouter un maximum de ${MAX_IMAGES} photos.`,
    }
  }

  const hasInvalidImage = images.some(
    (image) =>
      !ACCEPTED_IMAGE_TYPES.includes(image.type) ||
      image.size > MAX_IMAGE_SIZE_BYTES,
  )

  if (hasInvalidImage) {
    return {
      ok: false,
      error: `Une ou plusieurs images sont invalides. Maximum ${MAX_IMAGE_SIZE_MB} MB par image.`,
    }
  }

  return {
    ok: true,
    values: {
      name: safeName,
      description: safeDescription,
      justification: safeJustification,
      quantity: safeQuantity,
      price: safePrice,
      link: safeLink,
      expectedDate: safeExpectedDate,
      email: safeEmail,
    },
  }
}