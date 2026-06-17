type PurchaseRequestFormDataInput = {
  description: string
  neededByDate: string
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
  neededByDate,
  images,
  justification,
  link,
  name,
  price,
  quantity,
  quantityFormat,
  email,
}: PurchaseRequestFormDataInput) => {
  const formData = new FormData()

  formData.append("requested_by", name)
  formData.append("description", description)
  formData.append("quantity", String(quantity))

  formData.append("reason", justification || "")

  if (quantityFormat) {
    formData.append("quantity_format", quantityFormat)
  }


  if (price !== null) {
    formData.append("requested_unit_price", String(price))
  }

  if (link) {
    formData.append("product_link", link)
  }

  if (neededByDate) {
    formData.append("needed_by_date", neededByDate)
  }

  if (email) {
    formData.append("email", email)
  }

  images.forEach((image) => {
    formData.append("pictures", image, image.name)
  })

  return formData
}
