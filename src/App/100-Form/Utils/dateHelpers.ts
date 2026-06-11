export const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

export const monthFormatter = new Intl.DateTimeFormat("fr-CA", {
  month: "long",
  year: "numeric",
})

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export const getDateFromToday = (daysToAdd: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysToAdd)

  return toDateInputValue(date)
}

export const formatSelectedDate = (dateValue: string) => {
  if (!dateValue) return ""

  return dateFormatter.format(new Date(`${dateValue}T00:00:00`))
}

export const parseDateInputValue = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number)

  return new Date(year, month - 1, day)
}

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const parsedDate = parseDateInputValue(value)

  return toDateInputValue(parsedDate) === value
}
