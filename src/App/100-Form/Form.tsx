import { Calendar, DollarSign, Hash, Link2, PackageCheck, SquareDashedText, User, X } from "lucide-react"
import { useState } from "react"
import { getUrgencyFromExpectedDate } from "./getUrgencyFromExpectedDate"

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

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

const Form = () => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [justification, setJustification] = useState("")
  const [price, setPrice] = useState("")
  const [link, setLink] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [quantity, setQuantity] = useState("1")

  const minExpectedDate = getDateFromToday(0)
  const selectedDateLabel = formatSelectedDate(expectedDate)
  const quickDateOptions = [
    { label: "2 jours", value: getDateFromToday(2) },
    { label: "1 semaine", value: getDateFromToday(7) },
    { label: "2 semaines", value: getDateFromToday(14) },
    { label: "1 mois", value: getDateFromToday(30) },
  ]

  const urgency = getUrgencyFromExpectedDate(expectedDate)

  return (
    <section className="w-full flex flex-col items-center pb-10">
      <form action="" className="bg-tertiary shadow-lg flex flex-col w-[min(90%,32rem)] gap-5 mt-6 border border-secondary p-6 rounded-xl">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-2">
            <User className="text-white" size={28} />
          </div>
          <label htmlFor="name" className="flex flex-col gap-1">
            Nom:
          </label>
        </div>
        <input
          className="basic-input bg-white"
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <SquareDashedText className="text-white" size={28} />
          </div>
          <label htmlFor="description" className="flex flex-col gap-1">
            Description du produit à acheter:
          </label>
        </div>
        <textarea
          className="basic-input mx-auto w-full bg-white"
          name="description"
          id="description"
          cols={30}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center flex-1 gap-2">
  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
    <Hash className="text-white" size={28} />
  </div>
  <label htmlFor="quantity" className="flex flex-col gap-1">
    Quantité:
  </label>
</div>

<input
  className="basic-input bg-white"
  type="number"
  name="quantity"
  id="quantity"
  min="1"
  step="1"
  inputMode="numeric"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
/>

        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <PackageCheck className="text-white" size={28} />
          </div>
          <label htmlFor="justification" className="flex flex-col gap-1">
            Justification de l'achat:
          </label>
        </div>
        <textarea
          className="basic-input mx-auto w-full bg-white"
          name="justification"
          id="justification"
          rows={3}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />

        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <DollarSign className="text-white" size={28} />
          </div>
          <label htmlFor="price" className="flex flex-col gap-1">
            Prix connu ou estimé:
          </label>
        </div>
      <input
  className="basic-input bg-white"
  type="number"
  min="0"
  step="0.01"
  inputMode="decimal"
  name="price"
  id="price"
  value={price}
  onChange={(e) => setPrice(e.target.value)}
/>

        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Link2 className="text-white" size={28} />
          </div>
          <label htmlFor="link" className="flex flex-col gap-1">
            Lien vers le produit (si possible):
          </label>
        </div>
        <input
          className="basic-input bg-white"
          type="text"
          name="link"
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <div className="flex flex-col gap-3">
          <label htmlFor="expectedDate" className="flex gap-2 items-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="text-white" size={28} />
            </div>
            <span>Date a laquelle le produit est attendu:</span>
          </label>

          <div className="rounded-lg border-2 border-secondary bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
                {quickDateOptions.map((option) => (
                  <button
                    type="button"
                    key={option.label}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      expectedDate === option.value
                        ? "border-secondary bg-secondary text-white"
                        : "border-secondary/40 bg-tertiary text-secondary hover:bg-primary hover:text-white hover:cursor-pointer"
                    }`}
                    onClick={() => setExpectedDate(option.value)}
                    aria-pressed={expectedDate === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center">
                <input
                  className="basic-input w-full bg-white tablet:flex-1"
                  type="date"
                  name="expectedDate"
                  id="expectedDate"
                  min={minExpectedDate}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />

                {expectedDate && (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-secondary px-3 text-sm font-semibold text-secondary transition-colors hover:bg-tertiary"
                    onClick={() => setExpectedDate("")}
                    aria-label="Effacer la date selectionnee"
                  >
                    <X size={18} aria-hidden="true" />
                    Effacer
                  </button>
                )}
              </div>

              <p className="min-h-6 text-sm font-semibold text-secondary" aria-live="polite">
  {selectedDateLabel
    ? `Date requise: ${selectedDateLabel}`
    : "Aucune date requise choisie"}
</p>

{urgency && (
  <div className="rounded-md border border-secondary/40 bg-white px-3 py-2 text-sm">
    <span className="font-semibold text-secondary">
      Niveau d'urgence: {urgency.label}
    </span>
    <p className="text-gray-600">{urgency.message}</p>
  </div>
)}
            </div>
          </div>
        </div>
      </form>
    </section>
  )
}

export default Form
