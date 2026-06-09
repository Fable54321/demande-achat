import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Hash,
  ImagePlus,
  Link2,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
  X,
  type LucideIcon,
} from "lucide-react"
import { useEffect ,useState, type ReactNode } from "react"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import { getUrgencyFromExpectedDate } from "./getUrgencyFromExpectedDate"
import { getMonthStart} from "./Utils/getMonthStartandDays"
import DatePicker from "./DatePicker"

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

const monthFormatter = new Intl.DateTimeFormat("fr-CA", {
  month: "long",
  year: "numeric",
})



const fieldControlClass =
  "w-full rounded-lg border border-secondary/25 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-secondary focus:ring-4 focus:ring-primary/25"

const MAX_NAME_LENGTH = 80
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_JUSTIFICATION_LENGTH = 1000
const MAX_LINK_LENGTH = 2048
const MAX_QUANTITY = 9999
const MAX_PRICE = 999999.99

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const getDateFromToday = (daysToAdd: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysToAdd)

  return toDateInputValue(date)
}

const formatSelectedDate = (dateValue: string) => {
  if (!dateValue) return ""

  return dateFormatter.format(new Date(`${dateValue}T00:00:00`))
}

const parseDateInputValue = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number)

  return new Date(year, month - 1, day)
}

const stripUnsafeText = (value: string, maxLength: number) =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .slice(0, maxLength)

const sanitizeName = (value: string) =>
  stripUnsafeText(value, MAX_NAME_LENGTH).replace(
    /[^\p{L}\p{M} .,'-]/gu,
    "",
  )

const sanitizeQuantity = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 4)

  if (!digitsOnly) return ""

  return String(Math.min(Number(digitsOnly), MAX_QUANTITY))
}

const sanitizePrice = (value: string) => {
  const normalizedValue = value.replace(",", ".").replace(/[^\d.]/g, "")
  const [whole = "", ...decimalParts] = normalizedValue.split(".")
  const decimal = decimalParts.join("").slice(0, 2)
  const wholeNumber = whole.slice(0, 6)

  return decimalParts.length > 0 ? `${wholeNumber}.${decimal}` : wholeNumber
}

const sanitizeUrl = (value: string) =>
  stripUnsafeText(value.trim(), MAX_LINK_LENGTH).replace(/\s/g, "")

const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const parsedDate = parseDateInputValue(value)

  return toDateInputValue(parsedDate) === value
}

const isValidHttpUrl = (value: string) => {
  if (!value) return true

  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}





type FieldProps = {
  children: ReactNode
  helpText?: string
  icon: LucideIcon
  label: string
  optional?: boolean
}

const Field = ({
  children,
  helpText,
  icon: Icon,
  label,
  optional,
}: FieldProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <label className="block font-bold text-slate-900">
          {label}
          {optional && (
            <span className="ml-2 font-medium text-slate-500">Optionnel</span>
          )}
        </label>
        {helpText && <p className="mt-0.5 text-xs text-slate-500">{helpText}</p>}
      </div>
    </div>
    {children}
  </div>
)

const Form = () => {
  


  const { getPurchaseRequestFormToken, createPurchaseRequest, loading, error } =
  usePurchaseRequests()

  const [formToken, setFormToken] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [justification, setJustification] = useState("")
  const [price, setPrice] = useState("")
  const [link, setLink] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getMonthStart(new Date()),
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [images, setImages] = useState<File[]>([])

  useEffect(() => {
  const loadFormToken = async () => {
    const token = await getPurchaseRequestFormToken()
    setFormToken(token)
  }

  loadFormToken()
}, [getPurchaseRequestFormToken])

  const minExpectedDate = getDateFromToday(0)
  const minExpectedDateObject = parseDateInputValue(minExpectedDate)
  const selectedDateLabel = formatSelectedDate(expectedDate)

  const quickDateOptions = [
    { label: "Demain", value: getDateFromToday(1) },
    { label: "1 semaine", value: getDateFromToday(7) },
    { label: "2 semaines", value: getDateFromToday(14) },
    { label: "1 mois", value: getDateFromToday(30) },
  ]

  

  const urgency = getUrgencyFromExpectedDate(expectedDate)
  const selectExpectedDate = (dateValue: string) => {
    if (
      !isValidIsoDate(dateValue) ||
      parseDateInputValue(dateValue) < minExpectedDateObject
    ) {
      return
    }

    setExpectedDate(dateValue)
    setCalendarMonth(getMonthStart(parseDateInputValue(dateValue)))
    setIsDatePickerOpen(false)
  }


const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files ?? [])

  if (!selectedFiles.length) return

  const validImages = selectedFiles.filter((file) => {
    return file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE_BYTES
  })

  if (validImages.length !== selectedFiles.length) {
    setSubmitError(
      `Certaines images ont été ignorées. Maximum ${MAX_IMAGE_SIZE_MB} MB par image.`,
    )
  }

  setImages((currentImages) => {
    const combinedImages = [...currentImages, ...validImages]

    return combinedImages.slice(0, MAX_IMAGES)
  })

  e.target.value = ""
}

const removeImage = (indexToRemove: number) => {
  setImages((currentImages) =>
    currentImages.filter((_, index) => index !== indexToRemove),
  )
}  

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  setSubmitError(null)
  setSubmitSuccess(false)

  if (companyWebsite.trim()) {
    setSubmitError("La demande n'a pas pu etre envoyee.")
    return
  }

  if (!formToken) {
    setSubmitError("Problème lors de la créeation de la demande.")
    console.error(error)
    return
  }

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
  const safePrice = price ? Number(sanitizePrice(price)) : null
  const safeLink = sanitizeUrl(link)
  const safeExpectedDate = expectedDate.trim()

  if (!safeName) {
    setSubmitError("Le nom du demandeur est requis.")
    return
  }

  if (!safeDescription) {
    setSubmitError("La description de la demande est requise.")
    return
  }

  if (
    !Number.isInteger(safeQuantity) ||
    safeQuantity < 1 ||
    safeQuantity > MAX_QUANTITY
  ) {
    setSubmitError(`La quantite doit etre entre 1 et ${MAX_QUANTITY}.`)
    return
  }

  if (
    safePrice !== null &&
    (!Number.isFinite(safePrice) || safePrice < 0 || safePrice > MAX_PRICE)
  ) {
    setSubmitError("Le prix doit etre un montant valide.")
    return
  }

  if (!isValidHttpUrl(safeLink)) {
    setSubmitError("Le lien doit commencer par http:// ou https://.")
    return
  }

  if (
    safeExpectedDate &&
    (!isValidIsoDate(safeExpectedDate) ||
      parseDateInputValue(safeExpectedDate) < minExpectedDateObject)
  ) {
    setSubmitError("La date attendue doit etre aujourd'hui ou plus tard.")
    return
  }

const formData = new FormData()

formData.append("requested_by", safeName)
formData.append("description", safeDescription)
formData.append("quantity", String(safeQuantity))
formData.append("reason", safeJustification || "")

if (safePrice !== null) {
  formData.append("requested_unit_price", String(safePrice))
}

if (safeLink) {
  formData.append("product_link", safeLink)
}

if (safeExpectedDate) {
  formData.append("expected_date", safeExpectedDate)
}

images.forEach((image) => {
  formData.append("pictures", image)
})

const createdRequest = await createPurchaseRequest(formData, formToken)

  if (!createdRequest) return

  const newToken = await getPurchaseRequestFormToken()
  setFormToken(newToken)

  setName("")
  setDescription("")
  setJustification("")
  setPrice("")
  setLink("")
  setExpectedDate("")
  setSubmitError(null)
  setImages([])
  setSubmitSuccess(true)

  setTimeout(() => {
    setSubmitSuccess(false)
  }, 5000)
}
  return (
    <section className="w-full px-4 pb-10 pt-6 tablet:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-secondary/15 bg-white shadow-2xl shadow-secondary/10"
      >
        <div className="relative overflow-hidden border-b border-secondary/15 bg-[#eef4e8] px-5 py-5 shadow-[inset_0_-1px_0_rgba(75,115,18,0.08)] tablet:px-8">
          <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-white shadow-lg shadow-secondary/25">
                <ShoppingBag size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Nouvelle demande
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Achat à soumettre
                </h2>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Expliquez clairement ce dont vous avez besoin pour accélérer la
              validation et l'achat.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5 py-6 tablet:px-8">
          {submitError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>La demande d'achat a été créée avec succès.</span>
            </div>
          )}

          <div className="grid gap-5 tablet:grid-cols-2">
            <Field icon={User} label="Nom du demandeur">
              <input
                className={fieldControlClass}
                type="text"
                id="name"
                name="name"
                placeholder="Nom du demandeur"
                autoComplete="name"
                maxLength={MAX_NAME_LENGTH}
                value={name}
                onChange={(e) => setName(sanitizeName(e.target.value))}
                required
              />
            </Field>

            <Field icon={Hash} label="Quantité">
              <input
                className={fieldControlClass}
                type="number"
                name="quantity"
                id="quantity"
                min="1"
                max={MAX_QUANTITY}
                step="1"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => setQuantity(sanitizeQuantity(e.target.value))}
                required
              />
            </Field>
          </div>
        <input
  type="text"
  name="companyWebsite"
  value={companyWebsite}
  onChange={(e) => setCompanyWebsite(stripUnsafeText(e.target.value, 200))}
  className="hidden"
  tabIndex={-1}
  autoComplete="off"
/>

          <Field
            helpText="Produit, marque, modèle, dimensions, usage ou toute contrainte importante."
            icon={PackageCheck}
            label="Description de la demande"
          >
            <textarea
              className={`${fieldControlClass} min-h-28 resize-y leading-6`}
              name="description"
              id="description"
              placeholder="Décrire de façon claire le produit qui devra être acheté."
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(e) =>
                setDescription(
                  stripUnsafeText(e.target.value, MAX_DESCRIPTION_LENGTH),
                )
              }
              required
            />
          </Field>

          <Field
            helpText="Pourquoi l'achat est nécessaire."
            icon={PackageCheck}
            label="Justification de l'achat"
            optional
          >
            <textarea
              className={`${fieldControlClass} min-h-28 resize-y leading-6`}
              name="justification"
              id="justification"
              rows={3}
              maxLength={MAX_JUSTIFICATION_LENGTH}
              value={justification}
              onChange={(e) =>
                setJustification(
                  stripUnsafeText(e.target.value, MAX_JUSTIFICATION_LENGTH),
                )
              }
            />
          </Field>

          <div className="grid gap-5 tablet:grid-cols-2">
            <Field icon={DollarSign} label="Prix connu ou estimé (en $ cad)" optional>
              <input
                className={fieldControlClass}
                type="number"
                min="0"
                max={MAX_PRICE}
                step="0.01"
                inputMode="decimal"
                name="price"
                id="price"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(sanitizePrice(e.target.value))}
              />
            </Field>

            <Field
            helpText = "Un lien vers le produit facilitera la validation de la demande."
             icon={Link2} label="Lien vers le produit" optional>
              <input
                
                className={fieldControlClass}
                type="url"
                name="link"
                id="link"
                placeholder="https://..."
                maxLength={MAX_LINK_LENGTH}
                pattern="https?://.*"
                value={link}
                onChange={(e) => setLink(sanitizeUrl(e.target.value))}
              />
            </Field>
          </div>

          <Field
  helpText={`Ajoutez jusqu'à ${MAX_IMAGES} photos pour aider l'acheteur à identifier le produit.`}
  icon={ImagePlus}
  label="Photos"
  optional
>
  <div className="flex flex-col gap-3">
    <label
      className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-secondary/30 bg-tertiary/50 px-4 py-5 text-center transition hover:border-secondary hover:bg-primary/10 ${
        images.length >= MAX_IMAGES ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <ImagePlus className="mb-2 text-secondary" size={28} aria-hidden="true" />
      <span className="text-sm font-bold text-secondary">
        Ajouter des photos
      </span>
      <span className="mt-1 text-xs text-slate-500">
        {images.length}/{MAX_IMAGES} sélectionnées · Maximum {MAX_IMAGE_SIZE_MB} MB par image
      </span>

      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={images.length >= MAX_IMAGES}
        onChange={handleImageChange}
      />
    </label>

    {images.length > 0 && (
      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={`${image.name}-${image.lastModified}-${index}`}
            className="relative overflow-hidden rounded-lg border border-secondary/15 bg-white shadow-sm"
          >
            <img
              src={URL.createObjectURL(image)}
              alt={`Photo sélectionnée ${index + 1}`}
              className="h-28 w-full object-cover"
            />

            <button
              type="button"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-red-50 hover:text-red-700"
              onClick={() => removeImage(index)}
              aria-label={`Retirer la photo ${index + 1}`}
            >
              <X size={16} aria-hidden="true" />
            </button>

            <div className="truncate px-2 py-1.5 text-xs text-slate-500">
              {image.name}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</Field>

          <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
            <Field
              helpText="Choisissez une date ou utilisez un raccourci."
              icon={Calendar}
              label="Date attendue"
              optional
            >
              <div className="mt-1 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
                  {quickDateOptions.map((option) => (
                    <button
                      type="button"
                      key={option.label}
                      className={`h-10 rounded-lg border px-3 text-sm font-bold transition ${
                        expectedDate === option.value
                          ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20 "
                          : "border-secondary/20 bg-white text-secondary hover:border-secondary/45 hover:bg-primary/10 hover:cursor-pointer"
                      }`}
                      onClick={() => selectExpectedDate(option.value)}
                      aria-pressed={expectedDate === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center">
                  <input
                    type="hidden"
                    name="expectedDate"
                    value={expectedDate}
                  />

                  <div className="relative tablet:flex-1">
                    <button
                      type="button"
                      id="expectedDate"
                      className={`${fieldControlClass} flex min-h-12 items-center justify-between gap-3 text-left`}
                      onClick={() => setIsDatePickerOpen((isOpen) => !isOpen)}
                      aria-expanded={isDatePickerOpen}
                      aria-haspopup="dialog"
                    >
                      <span
                        className={
                          selectedDateLabel ? "text-slate-900" : "text-slate-400"
                        }
                      >
                        {selectedDateLabel || "Choisir une date"}
                      </span>
                      <Calendar
                        className="shrink-0 text-secondary"
                        size={18}
                        aria-hidden="true"
                      />
                    </button>

                    {isDatePickerOpen && (
                      <DatePicker 
                      setCalendarMonth={setCalendarMonth}
                      calendarMonth={calendarMonth}
                      monthFormatter={monthFormatter}
                      expectedDate={expectedDate}
                      minExpectedDateObject={minExpectedDateObject}
                      selectExpectedDate={selectExpectedDate}
                      toDateInputValue={toDateInputValue}
                      />
                    )}
                  </div>

                  {expectedDate && (
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-secondary/25 bg-white px-4 text-sm font-bold text-secondary transition hover:bg-secondary hover:text-white"
                      onClick={() => {
                        setExpectedDate("")
                        setIsDatePickerOpen(false)
                      }}
                      aria-label="Effacer la date sélectionnée"
                    >
                      <X size={18} aria-hidden="true" />
                      Effacer
                    </button>
                  )}
                </div>

                <div className="grid gap-3 tablet:grid-cols-[1fr_auto] tablet:items-center">
                  <p
                    className="min-h-6 text-sm font-semibold text-slate-700"
                    aria-live="polite"
                  >
                    {selectedDateLabel
                      ? `Date requise : ${selectedDateLabel}`
                      : "Aucune date requise choisie"}
                  </p>

                  {urgency && (
                    <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 text-sm shadow-sm">
                      <span className="font-bold text-secondary">
                        {urgency.label}
                      </span>
                      <span className="ml-2 text-slate-500">
                        {urgency.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-8">
          
          <button
            type="submit"
            disabled={loading || !formToken}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg
             bg-secondary px-6 text-sm font-black text-white shadow-lg shadow-secondary/20 transition 
             hover:bg-[#3f610f] 
             hover:cursor-pointer
             focus:outline-none focus:ring-4
             mr-0 ml-auto
             focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Send size={18} aria-hidden="true" />
            {loading ? "Envoi en cours..." : "Soumettre la demande"}
          </button>
        </div>
      </form>
      {submitSuccess && <p className="mt-4 text-green-600">La demande a bien été envoyée.</p>}
    </section>
  )
}

export default Form
