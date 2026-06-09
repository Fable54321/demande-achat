import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Hash,
  Link2,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
  X,
  type LucideIcon,
} from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
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
  <div className="flex flex-col gap-2">
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <label className="block text-sm font-bold text-slate-900">
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
  const { createPurchaseRequest, loading, error } = usePurchaseRequests()

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
    setExpectedDate(dateValue)
    setCalendarMonth(getMonthStart(parseDateInputValue(dateValue)))
    setIsDatePickerOpen(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    const trimmedDescription = description.trim()

    if (!name.trim()) {
      setSubmitError("Le nom du demandeur est requis.")
      return
    }

    if (!trimmedDescription) {
      setSubmitError("La description de la demande est requise.")
      return
    }

    if (!quantity || parseInt(quantity) < 1) {
      setSubmitError("La quantité doit être d'au moins 1.")
      return
    }

    const result = await createPurchaseRequest({
      requested_by: name,
      description: trimmedDescription,
      quantity: parseInt(quantity),
      reason: justification || undefined,
      requested_unit_price: price ? parseFloat(price) : undefined,
      requested_supplier: undefined,
      product_link: link || undefined,
      expected_date: expectedDate || undefined,
    })

    if (result) {
      setSubmitSuccess(true)
      setName("")
      setDescription("")
      setJustification("")
      setPrice("")
      setLink("")
      setExpectedDate("")
      setQuantity("1")
      setTimeout(() => setSubmitSuccess(false), 3000)
    } else {
      setSubmitError(error || "Impossible de créer la demande d'achat.")
    }
  }

  return (
    <section className="w-full px-4 pb-10 pt-6 tablet:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-secondary/15 bg-white shadow-2xl shadow-secondary/10"
      >
        <div className="border-b border-secondary/10 bg-tertiary px-5 py-5 tablet:px-8">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                step="1"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
          </div>

          <Field
            helpText="Produit, marque, modèle, dimensions, usage ou toute contrainte importante."
            icon={PackageCheck}
            label="Description de la demande"
          >
            <textarea
              className={`${fieldControlClass} min-h-40 resize-y leading-6`}
              name="description"
              id="description"
              placeholder="Décrir de façon claire le produit qui devra être acheté."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </Field>

          <div className="grid gap-5 tablet:grid-cols-2">
            <Field icon={DollarSign} label="Prix connu ou estimé" optional>
              <input
                className={fieldControlClass}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                name="price"
                id="price"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>

            <Field icon={Link2} label="Lien vers le produit" optional>
              <input
                className={fieldControlClass}
                type="url"
                name="link"
                id="link"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </Field>
          </div>

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
          <p className="text-sm text-slate-500">
            Une description claire aide le service achat à trouver le bon
            produit plus rapidement.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-6 text-sm font-black text-white shadow-lg shadow-secondary/20 transition hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Send size={18} aria-hidden="true" />
            {loading ? "Envoi en cours..." : "Soumettre la demande"}
          </button>
        </div>
      </form>
    </section>
  )
}

export default Form
