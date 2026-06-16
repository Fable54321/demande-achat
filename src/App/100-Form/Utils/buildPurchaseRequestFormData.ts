type PurchaseRequestFormDataInput = {
  description: string
  expectedDate: string
  images: File[]
  justification: string
  link: string
  name: string
  price: number | null
  quantity: number
  quantityFormat: string
  email: string | null
}

export const buildPurchaseRequestFormData = ({
  description,
  expectedDate,
  images,
  justification,
  link,
  name,
  price,
  quantity,
  email,
}: PurchaseRequestFormDataInput) => {
  const formData = new FormData()

  formData.append("requested_by", name)
  formData.append("description", description)
  formData.append("quantity", String(quantity))
  formData.append("reason", justification || "")

  if (price !== null) {
    formData.append("requested_unit_price", String(price))
  }

  if (link) {
    formData.append("product_link", link)
  }

  if (expectedDate) {
    formData.append("expected_date", expectedDate)
  }

  if (email) {
    formData.append("email", email)
  }

  images.forEach((image) => {
    formData.append("pictures", image, image.name)
  })

  return formData
}
