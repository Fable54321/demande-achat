export const getMonthStart = (date: Date) => {
  const monthStart = new Date(date)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  return monthStart
}


export const getCalendarDays = (monthDate: Date) => {
  const firstDay = getMonthStart(monthDate)
  const firstVisibleDay = new Date(firstDay)
  firstVisibleDay.setDate(firstVisibleDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay)
    date.setDate(firstVisibleDay.getDate() + index)

    return date
  })
}