export const getUrgencyFromExpectedDate = (dateValue: string) => {
  if (!dateValue) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedDate = new Date(`${dateValue}T00:00:00`)
  selectedDate.setHours(0, 0, 0, 0)

  const differenceInMs = selectedDate.getTime() - today.getTime()
  const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24))

  if (differenceInDays <= 7) {
    return {
      label: "Urgent",
      value: "urgent",
      message: "Requis dans 7 jours ou moins",
    }
  }

  if (differenceInDays <= 14) {
    return {
      label: "Prioritaire",
      value: "priority",
      message: "Requis dans 8 à 14 jours",
    }
  }

  return {
    label: "Normal",
    value: "normal",
    message: "Requis dans plus de 14 jours",
  }
}