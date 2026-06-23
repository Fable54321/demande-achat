import {
  AlertCircle,
  Calendar,
  DollarSign,
  Hash,
  ImagePlus,
  Link2,
  PackageCheck,
  Send,
  ShoppingBag,
  SquareStack,
  User,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { usePurchaseRequests, type Employee } from "../../Contexts/PurchaseRequestContext"
import { getUrgencyFromExpectedDate } from "./getUrgencyFromExpectedDate"
import { getMonthStart} from "./Utils/getMonthStartandDays"
import DatePicker from "./DatePicker"
import {
  formatSelectedDate,
  getDateFromToday,
  monthFormatter,
  parseDateInputValue,
  toDateInputValue,
} from "./Utils/dateHelpers"
import {
  ACCEPTED_IMAGE_TYPES,
  fieldControlClass,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MAX_JUSTIFICATION_LENGTH,
  MAX_LINK_LENGTH,
  MAX_PURCHASE_ITEMS,
  MAX_QUANTITY_FORMAT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PRICE,
  MAX_QUANTITY,
} from "./Utils/formConstants"
import {
  sanitizeName,
  sanitizePrice,
  sanitizeQuantity,
  sanitizeUrl,
  stripUnsafeText,
} from "./Utils/sanitizers"
import Field from "./Field"
import SuccesOverlay from "../SuccesOverlay"
import { validatePurchaseRequestForm } from "./Utils/validatePurchaseRequestForm"





const Form = () => {
  


  const {
    getPurchaseRequestFormToken,
    createPurchaseRequest,
    
    loading,
    employees,
  } =
  usePurchaseRequests()

  const [formToken, setFormToken] = useState<string | null>(null)
  const [formTokenExpiresAt, setFormTokenExpiresAt] = useState<string | null>(null)
  const [isFormTokenExpired, setIsFormTokenExpired] = useState(false)
  const [isRefreshingFormToken, setIsRefreshingFormToken] = useState(false)

  const [name, setName] = useState("")
  const [submittedByName, setSubmittedByName] = useState("")
  const [email, setEmail] = useState("")
  const createEmptyItem = () => ({
    description: "",
    images: [] as File[],
    justification: "",
    link: "",
    price: "",
    quantity: "1",
    quantityFormat: "",
  })

  const [hasMultipleItems, setHasMultipleItems] = useState(false)
  const [purchaseItemCount, setPurchaseItemCount] = useState("1")
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [purchaseItems, setPurchaseItems] = useState([createEmptyItem()])
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getMonthStart(new Date()),
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [neededByDate, setNeededByDate] = useState("")

  const requestedItemCount = Number(purchaseItemCount) || 1
  const itemCount = hasMultipleItems ? requestedItemCount : 1
  const currentItem = purchaseItems[currentItemIndex] ?? createEmptyItem()
  const description = currentItem.description
  const isDescriptionAtLimit = description.length >= MAX_DESCRIPTION_LENGTH
  const justification = currentItem.justification
  const price = currentItem.price
  const link = currentItem.link
  const quantity = currentItem.quantity
  const quantityFormat = currentItem.quantityFormat
  const isQuantityFormatAtLimit =
    quantityFormat.length >= MAX_QUANTITY_FORMAT_LENGTH
  const images = currentItem.images
  const totalImageCount = purchaseItems.reduce(
    (total, item) => total + item.images.length,
    0,
  )

  const updateCurrentItem = (
    updates: Partial<ReturnType<typeof createEmptyItem>>,
  ) => {
    setPurchaseItems((currentItems) =>
      currentItems.map((item, index) =>
        index === currentItemIndex ? { ...item, ...updates } : item,
      ),
    )
  }

  const resizePurchaseItems = (nextCount: number) => {
    const safeCount = Math.min(Math.max(nextCount, 1), MAX_PURCHASE_ITEMS)

    setPurchaseItems((currentItems) => {
      const nextItems = currentItems.slice(0, safeCount)

      while (nextItems.length < safeCount) {
        nextItems.push(createEmptyItem())
      }

      return nextItems
    })

    setCurrentItemIndex((index) => Math.min(index, safeCount - 1))
    setIsDatePickerOpen(false)
  }

  const itemSwitchButtons = hasMultipleItems ? (
    <div className="flex flex-wrap gap-2">
      {purchaseItems.slice(0, itemCount).map((_, index) => (
        <button
          type="button"
          key={index}
          className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-black transition ${
            index === currentItemIndex
              ? "border-secondary bg-secondary text-white shadow-sm"
              : "border-secondary/20 bg-white text-secondary hover:bg-primary/10"
          }`}
          onClick={() => {
            setCurrentItemIndex(index)
            setIsDatePickerOpen(false)
          }}
          aria-label={`Aller a l'article ${index + 1}`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  ) : null


  const officeWorkers = useMemo(
    () => employees.filter((employee) => employee.is_office),
    [employees],
  )

const refreshFormToken = useCallback(async () => {
  try {
    setIsRefreshingFormToken(true)
    setSubmitError(null)

    const tokenData = await getPurchaseRequestFormToken()

    if (!tokenData?.token) {
      setFormToken(null)
      setFormTokenExpiresAt(null)
      setIsFormTokenExpired(true)
      setSubmitError(
        "Impossible de préparer le formulaire. Veuillez réessayer.",
      )
      return
    }

    setFormToken(tokenData.token)
    setFormTokenExpiresAt(tokenData.expires_at ?? null)
    setIsFormTokenExpired(false)
  } catch (error) {
    console.error("Purchase request form token refresh failed:", error)

    const message =
      error instanceof Error
        ? error.message
        : "Impossible de préparer le formulaire. Veuillez réessayer."

    setFormToken(null)
    setFormTokenExpiresAt(null)
    setIsFormTokenExpired(true)
    setSubmitError(message)
  } finally {
    setIsRefreshingFormToken(false)
  }
}, [getPurchaseRequestFormToken])

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  refreshFormToken()
}, [refreshFormToken])

  useEffect(() => {
    if (!formTokenExpiresAt) return

    const expiresAt = new Date(formTokenExpiresAt).getTime()
    const timeUntilExpiry = expiresAt - Date.now()

    const timeoutId = window.setTimeout(() => {
      setIsFormTokenExpired(true)
    }, Math.max(0, timeUntilExpiry))

    return () => window.clearTimeout(timeoutId)
  }, [formTokenExpiresAt])




  const minNeededByDate = getDateFromToday(0)
  const minNeededByDateObject = parseDateInputValue(minNeededByDate)
  const selectedDateLabel = formatSelectedDate(neededByDate)

  const quickDateOptions = [
    { label: "Demain", value: getDateFromToday(1) },
    { label: "1 semaine", value: getDateFromToday(7) },
    { label: "2 semaines", value: getDateFromToday(14) },
    { label: "1 mois", value: getDateFromToday(30) },
  ]

  //// CLOSING DATEPICKER ON CLICK OUTSIDE  

  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if(!isDatePickerOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {

      const target = event.target as Node

      if(datePickerRef.current &&
        !datePickerRef.current.contains(target)
      ){
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside)
    }

    

  },[isDatePickerOpen])

  const urgency = getUrgencyFromExpectedDate(neededByDate)



const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files ?? [])

  if (!selectedFiles.length) return

  const remainingSlots = MAX_IMAGES - images.length

  if (remainingSlots <= 0) {
    e.target.value = ""
    return
  }

  const validImages = selectedFiles.filter((file) => {
    return (
      ACCEPTED_IMAGE_TYPES.includes(file.type) &&
      file.size <= MAX_IMAGE_SIZE_BYTES
    )
  })

  if (validImages.length !== selectedFiles.length) {
    setSubmitError(
      `Certaines images ont été ignorées. Maximum ${MAX_IMAGE_SIZE_MB} MB par image.`,
    )
  }

  updateCurrentItem({
    images: [
      ...images,
      ...validImages.slice(0, remainingSlots),
    ].slice(0, MAX_IMAGES),
  })

  e.target.value = ""
}

const removeImage = (indexToRemove: number) => {
  updateCurrentItem({
    images: images.filter((_, index) => index !== indexToRemove),
  })
}

const imagePreviews = useMemo(
  () =>
    images.map((image) => ({
      file: image,
      previewUrl: URL.createObjectURL(image),
    })),
  [images],
)

useEffect(() => {
  return () => {
    imagePreviews.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
  }
}, [imagePreviews])


const resetForm = () => {
  setName("")
  setSelectedEmployee(null)
  setEmail("")
  setPurchaseItems([createEmptyItem()])
  setHasMultipleItems(false)
  setPurchaseItemCount("1")
  setCurrentItemIndex(0)
  setIsDatePickerOpen(false)
}



const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  setSubmitError(null)
  setSubmitSuccess(false)

  if (companyWebsite.trim()) {
    setSubmitError("La demande n'a pas pu être envoyée.")
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  if (!formToken || isFormTokenExpired) {
    setSubmitError(
      "Le formulaire a expiré. Rafraîchissez-le avant de soumettre la demande.",
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  if (purchaseItems.length > 10) {
    setSubmitError("Vous ne pouvez pas soumettre plus de 10 articles par demande.")
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  const activeItems = purchaseItems.slice(0, itemCount)

  const totalImageCount = activeItems.reduce(
    (total, item) => total + item.images.length,
    0,
  )

  if (totalImageCount > MAX_IMAGES) {
    setSubmitError(
      `Vous pouvez joindre un maximum de ${MAX_IMAGES} photos par demande.`,
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  const validations = activeItems.map((item) =>
    validatePurchaseRequestForm({
      name,
      description: item.description,
      justification: item.justification,
      quantity: item.quantity,
      quantityFormat: item.quantityFormat,
      price: item.price,
      link: item.link,
      neededByDate,
      email,
      images: item.images,
      minNeededByDateObject,
    }),
  )

  const invalidItemIndex = validations.findIndex((validation) => !validation.ok)

  if (invalidItemIndex >= 0) {
    const validation = validations[invalidItemIndex]

    setCurrentItemIndex(invalidItemIndex)
    setSubmitError(
      validation.ok
        ? "Une demande est invalide."
        : `${itemCount > 1 ? `Article ${invalidItemIndex + 1}: ` : ""}${
            validation.error
          }`,
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  const validatedItems = validations
    .filter((validation) => validation.ok)
    .map((validation) => validation.values)

  if (validatedItems.length === 0) {
    setSubmitError("La demande doit contenir au moins un article.")
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  const submittedName = validatedItems[0].name
 
  
  const formData = new FormData()

  formData.append("requested_by", submittedName)

  if (validatedItems[0].email) {
    formData.append("email", validatedItems[0].email)
  }

 if(neededByDate) {
    formData.append("needed_by_date", neededByDate)
  }


  formData.append("companyWebsite", companyWebsite)

  formData.append(
    "items",
    JSON.stringify(
      validatedItems.map((item, index) => ({
        item_index: index + 1,
        description: item.description,
        reason: item.justification || null,
        quantity: item.quantity,
        quantity_format: item.quantityFormat || null,
        requested_unit_price: item.price === null ? null : item.price,
        requested_supplier: null,
        product_link: item.link || null,
      })),
    ),
  )

  activeItems.forEach((item) => {
    item.images.forEach((image) => {
      formData.append("pictures", image, image.name)
    })
  })

  try {
    const createdRequest = await createPurchaseRequest(formData, formToken)

    if (!createdRequest) {
      setSubmitError(
        "La demande n'a pas pu être envoyée. Veuillez réessayer.",
      )
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const newToken = await getPurchaseRequestFormToken()

    if (!newToken?.token) {
      setSubmitError(
        "La demande a été envoyée, mais le formulaire n'a pas pu être réinitialisé correctement. Veuillez rafraîchir la page avant d'envoyer une autre demande.",
      )
      setSubmitSuccess(true)
      setSubmittedByName(submittedName)
      resetForm()
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setFormToken(newToken.token)
    setFormTokenExpiresAt(newToken.expires_at ?? null)
    setIsFormTokenExpired(false)

    setSubmittedByName(submittedName)
    resetForm()

    setSubmitError(null)
    setSubmitSuccess(true)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })

    setTimeout(() => {
      setSubmitSuccess(false)
    }, 4000)
  } catch (error) {
    console.error("Purchase request submit failed:", error)

    const message =
      error instanceof Error
        ? error.message
        : "Une erreur inattendue est survenue lors de l'envoi de la demande."

    setSubmitError(message)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }
}


const successMessage = "Votre demande d'achat a bien été envoyée"



  return (
    <section className={`relative w-full px-4 pb-10 pt-6 tablet:px-8 `}>
      {submitSuccess && 
       
          <SuccesOverlay
          successMessage={successMessage}
          onClose={() => setSubmitSuccess(false)}
          name={submittedByName}
          />
       
      }
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

        

          {isFormTokenExpired && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 tablet:flex-row tablet:items-center tablet:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>
                  Ce formulaire a expiré. Rafraîchissez-le avant de soumettre la demande.
                </span>
              </div>

              <button
                type="button"
                onClick={refreshFormToken}
                disabled={isRefreshingFormToken}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white px-4 text-sm font-black text-amber-900 shadow-sm transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshingFormToken ? "Rafraichissement..." : "Rafraichir le formulaire"}
              </button>
            </div>
          )}

          <div className="grid gap-5 tablet:grid-cols-2">

         <div className="relative">
  <Field icon={User} label="Nom du demandeur">
    <input
      className={fieldControlClass}
      type="text"
      id="name"
      name="name"
      list="office-workers-list"
      placeholder="Nom du demandeur"
      autoComplete="off"
      maxLength={MAX_NAME_LENGTH}
      value={name}
      onChange={(e) => {
        const sanitizedName = sanitizeName(e.target.value)

        setName(sanitizedName)

        const matchingEmployee = officeWorkers.find((employee) => {
          const fullName = `${employee.surname} ${employee.name}`.trim()
          return fullName === sanitizedName
        })

        setSelectedEmployee(matchingEmployee ?? null)
        setEmail(matchingEmployee?.email ?? "")
      }}
      required
    />

    <datalist id="office-workers-list">
      {officeWorkers.map((employee) => {
        const fullName = `${employee.surname} ${employee.name}`.trim()

        return <option key={employee.id} value={fullName} />
      })}
    </datalist>
  </Field>

  {selectedEmployee?.email && (
    <p className="mt-2 rounded-xl border border-secondary/10 bg-slate-50 px-4 py-2 text-sm text-secondary/80">
      Courriel :{" "}
      <span className="font-medium text-secondary">
        {selectedEmployee.email}
      </span>
    </p>
  )}
</div>
<div className="grid gap-5 gap-x-10 tablet:grid-cols-2">
  <Field icon={SquareStack} label="Plusieurs articles?">
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        className={`h-12 rounded-lg border px-3 text-sm font-black transition ${
          !hasMultipleItems
            ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20"
            : "border-secondary/20 bg-white text-secondary hover:border-secondary/45 hover:bg-primary/10"
        }`}
        onClick={() => {
          setHasMultipleItems(false)
          setPurchaseItemCount("1")
          resizePurchaseItems(1)
        }}
        aria-pressed={!hasMultipleItems}
      >
        Non
      </button>

      <button
        type="button"
        className={`h-12 rounded-lg border px-3 text-sm font-black transition ${
          hasMultipleItems
            ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20"
            : "border-secondary/20 bg-white text-secondary hover:border-secondary/45 hover:bg-primary/10"
        }`}
        onClick={() => {
          const nextCount = Math.max(2, itemCount)
          setHasMultipleItems(true)
          setPurchaseItemCount(String(nextCount))
          resizePurchaseItems(nextCount)
        }}
        aria-pressed={hasMultipleItems}
      >
        Oui
      </button>
    </div>
  </Field>

   

  {hasMultipleItems && (
    <Field icon={Hash} label="Nombre d'articles">
      <input
        className={fieldControlClass}
        type="number"
        min="2"
        max={MAX_PURCHASE_ITEMS}
        step="1"
        inputMode="numeric"
        value={purchaseItemCount}
        onChange={(e) => {
          const nextValue = sanitizeQuantity(e.target.value)
          const nextCount = Math.min(
            Math.max(Number(nextValue) || 2, 2),
            MAX_PURCHASE_ITEMS,
          )

          setPurchaseItemCount(String(nextCount))
          resizePurchaseItems(nextCount)
        }}
      />
    </Field>
  )}
</div>
          </div>

          <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
            <Field
              helpText="Choisissez une date ou utilisez un raccourci."
              icon={Calendar}
              label="Date attendue"
              optionnelle
            >
              <div className="mt-1 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
                  {quickDateOptions.map((option) => (
                    <button
                      type="button"
                      key={option.label}
                      className={`h-10 rounded-lg border px-3 text-sm font-bold transition ${
                        neededByDate === option.value
                          ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20 "
                          : "border-secondary/20 bg-white text-secondary hover:border-secondary/45 hover:bg-primary/10 hover:cursor-pointer"
                      }`}
                      onClick={() => setNeededByDate(option.value)}
                      aria-pressed={neededByDate === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center">
                  <input
                    type="hidden"
                    name="needed_by_date"
                    value={neededByDate}
                  />
{/* DATEPICKER */}
                  <div className="relative tablet:flex-1" ref={datePickerRef}>
                    <button
                      type="button"
                      id="neededByDate"
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
                      selectedDate={neededByDate}
                      minDate={minNeededByDateObject}
                      selectDate={setNeededByDate}
                      toDateInputValue={toDateInputValue}
                      />
                    )}
                  </div>

                  {neededByDate && (
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-secondary/25 bg-white px-4 text-sm font-bold text-secondary transition hover:bg-secondary hover:text-white"
                      onClick={() => {
                        setNeededByDate("")
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

          <div className="flex flex-col gap-3 rounded-lg border border-secondary/15 bg-slate-50 px-4 py-3 tablet:flex-row tablet:items-center tablet:justify-between">
            <div>
              <p className="text-[1.2em] font-black text-secondary">
                Article {currentItemIndex + 1}/{itemCount}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Remplissez les details de cet article avant de passer au suivant.
              </p>
            </div>

            {hasMultipleItems && (
              itemSwitchButtons
            )}
          </div>

          <div className="grid gap-5 gap-x-10 tablet:grid-cols-2">
  <Field
    icon={Hash}
    label="Quantité"
    
  
  >
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
      placeholder="Ex: 2"
      value={quantity}
      onChange={(e) =>
        updateCurrentItem({ quantity: sanitizeQuantity(e.target.value) })
      }
    />
  </Field>

  <Field
   
    label="Format"
    optional
    helpText="Précisez seulement si utile : boîte, paquet, caisse, rouleau, etc."
  >
    <div className="space-y-2">
      <input
      className={fieldControlClass}
      type="text"
      name="quantity_format"
      id="quantityFormat"
      placeholder="Ex: boîte(s), paquet(s)"
      maxLength={MAX_QUANTITY_FORMAT_LENGTH}
      value={quantityFormat}
      onChange={(e) =>
        updateCurrentItem({
          quantityFormat: stripUnsafeText(
            e.target.value,
            MAX_QUANTITY_FORMAT_LENGTH,
          ),
        })
      }
      />
      <div
        className={`flex justify-between gap-3 text-xs font-semibold ${
          isQuantityFormatAtLimit ? "text-orange-700" : "text-slate-500"
        }`}
      >
        <span>
          {isQuantityFormatAtLimit
            ? `Limite atteinte: ${MAX_QUANTITY_FORMAT_LENGTH} caractères maximum.`
            : `${MAX_QUANTITY_FORMAT_LENGTH} caractères maximum.`}
        </span>
        <span>
          {quantityFormat.length}/{MAX_QUANTITY_FORMAT_LENGTH}
        </span>
      </div>
    </div>
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
            label="Description du produit demandé"
          >
            <div className="space-y-2">
              <textarea
              className={`${fieldControlClass} min-h-28 resize-y leading-6 text-`}
              name="description"
              id="description"
              placeholder="Décrire de façon claire le produit qui devra être acheté."
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(e) =>
                updateCurrentItem({
                  description: stripUnsafeText(
                    e.target.value,
                    MAX_DESCRIPTION_LENGTH,
                  ),
                })
              }
              required
            />
              <div
                className={`flex justify-between gap-3 text-xs font-semibold ${
                  isDescriptionAtLimit ? "text-orange-700" : "text-slate-500"
                }`}
              >
                <span>
                  {isDescriptionAtLimit
                    ? `Limite atteinte: ${MAX_DESCRIPTION_LENGTH} caractères maximum.`
                    : `${MAX_DESCRIPTION_LENGTH} caractères maximum.`}
                </span>
                <span>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>
          </Field>

          <Field
            helpText="Pourquoi l'achat est nécessaire."
            icon={PackageCheck}
            label="Justification de l'achat"
            optional
          >
            <textarea
              className={`${fieldControlClass} min-h-28 resize-y leading-6 text-[1.1rem]`}
              name="justification"
              id="justification"
              rows={3}
              maxLength={MAX_JUSTIFICATION_LENGTH}
              value={justification}
              onChange={(e) =>
                updateCurrentItem({
                  justification: stripUnsafeText(
                    e.target.value,
                    MAX_JUSTIFICATION_LENGTH,
                  ),
                })
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
                onChange={(e) =>
                  updateCurrentItem({ price: sanitizePrice(e.target.value) })
                }
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
                onChange={(e) =>
                  updateCurrentItem({ link: sanitizeUrl(e.target.value) })
                }
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
      htmlFor="purchase-request-pictures"
      className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-secondary/30 bg-tertiary/50 px-4 py-5 text-center transition hover:border-secondary hover:bg-primary/10 ${
        images.length >= MAX_IMAGES ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <ImagePlus className="mb-2 text-secondary" size={28} aria-hidden="true" />
      <span className="text-sm font-bold text-secondary">
        Ajouter des photos
      </span>
      <span className="mt-1 text-xs text-slate-500">
        {totalImageCount}/{MAX_IMAGES} sélectionnées · Maximum {MAX_IMAGE_SIZE_MB} MB par image
      </span>

      <input
        id="purchase-request-pictures"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        disabled={images.length >= MAX_IMAGES}
        onChange={handleImageChange}
      />
    </label>

    {imagePreviews.length > 0 && (
      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-5">
        {imagePreviews.map(({ file, previewUrl }, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="relative overflow-hidden rounded-lg border border-secondary/15 bg-white shadow-sm"
          >
            <img
              src={previewUrl}
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
              {file.name}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</Field>

         
        </div>

        <div className="flex flex-col gap-3 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-8">
          {hasMultipleItems ? (
            <div className="flex flex-col gap-3">
              {itemSwitchButtons}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={currentItemIndex === 0}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-secondary/25 bg-white px-4 text-sm font-black text-secondary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setCurrentItemIndex((index) => Math.max(index - 1, 0))
                    setIsDatePickerOpen(false)
                  }}
                >
                  Precedent
                </button>

                {currentItemIndex < itemCount - 1 && (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-secondary/25 bg-white px-4 text-sm font-black text-secondary transition hover:bg-primary/10"
                    onClick={() => {
                      setCurrentItemIndex((index) =>
                        Math.min(index + 1, itemCount - 1),
                      )
                      setIsDatePickerOpen(false)
                    }}
                  >
                    Article suivant
                  </button>
                )}
              </div>
            </div>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={loading || !formToken || isFormTokenExpired || isRefreshingFormToken}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg
             bg-secondary px-6 text-sm font-black text-white shadow-lg shadow-secondary/20 transition 
             hover:bg-[#3f610f] 
             hover:cursor-pointer
             focus:outline-none focus:ring-4
             mr-0 ml-auto
             focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Send size={18} aria-hidden="true" />
            {loading
              ? "Envoi en cours..."
              : itemCount > 1
                ? `Soumettre ${itemCount} articles`
                : "Soumettre la demande"}
          </button>
        </div>
      </form>
      
    </section>
  )
}

export default Form
