import { ChevronLeft, ChevronRight } from "lucide-react"
import { getMonthStart, getCalendarDays } from "./Utils/getMonthStartandDays"

type DatePickerProps = {
  setCalendarMonth: (date: Date) => void
  calendarMonth: Date
  monthFormatter: Intl.DateTimeFormat
  expectedDate: string
  minExpectedDateObject: Date
  selectExpectedDate: (dateValue: string) => void
  toDateInputValue: (date: Date) => string
}




const DatePicker = (  { setCalendarMonth, calendarMonth, monthFormatter, expectedDate, minExpectedDateObject, selectExpectedDate, toDateInputValue }: DatePickerProps) => {





  const calendarDays = getCalendarDays(calendarMonth)
  const previousCalendarMonth = new Date(calendarMonth)
  previousCalendarMonth.setMonth(previousCalendarMonth.getMonth() - 1)
  const nextCalendarMonth = new Date(calendarMonth)
  nextCalendarMonth.setMonth(nextCalendarMonth.getMonth() + 1)
  const canGoToPreviousMonth =
    previousCalendarMonth >= getMonthStart(minExpectedDateObject)


    const weekdayLabels = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]



  return (
   <div
                        className="absolute left-0 bottom-0 z-20 w-full rounded-lg border border-secondary/20 bg-white p-3 shadow-xl shadow-secondary/15 tablet:max-w-sm"
                        role="dialog"
                        aria-label="Calendrier de date attendue"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-secondary/20 text-secondary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => setCalendarMonth(previousCalendarMonth)}
                            disabled={!canGoToPreviousMonth}
                            aria-label="Mois precedent"
                          >
                            <ChevronLeft size={18} aria-hidden="true" />
                          </button>
                          <p className="text-sm font-black capitalize text-slate-900">
                            {monthFormatter.format(calendarMonth)}
                          </p>
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-secondary/20 text-secondary transition hover:bg-primary/10"
                            onClick={() => setCalendarMonth(nextCalendarMonth)}
                            aria-label="Mois suivant"
                          >
                            <ChevronRight size={18} aria-hidden="true" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {weekdayLabels.map((weekday) => (
                            <span
                              key={weekday}
                              className="py-1 text-[0.7rem] font-bold uppercase text-slate-500"
                            >
                              {weekday}
                            </span>
                          ))}
                          {calendarDays.map((date) => {
                            const dateValue = toDateInputValue(date)
                            const isCurrentMonth =
                              date.getMonth() === calendarMonth.getMonth()
                            const isSelected = expectedDate === dateValue
                            const isDisabled = date < minExpectedDateObject

                            return (
                              <button
                                type="button"
                                key={dateValue}
                                className={`grid h-9 place-items-center rounded-lg text-sm font-bold transition ${
                                  isSelected
                                    ? "bg-secondary text-white shadow-md shadow-secondary/20"
                                    : "text-slate-800 hover:bg-primary/10"
                                } ${
                                  isCurrentMonth ? "" : "text-slate-300"
                                } disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent`}
                                onClick={() => selectExpectedDate(dateValue)}
                                disabled={isDisabled}
                                aria-pressed={isSelected}
                              >
                                {date.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
  )
}

export default DatePicker
