import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Mail,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import DatePicker from "../100-Form/DatePicker"
import { getMonthStart } from "../100-Form/Utils/getMonthStartandDays"
import {
  formatSelectedDate,
  getDateFromToday,
  isValidIsoDate,
  monthFormatter,
  parseDateInputValue,
  toDateInputValue,
} from "../100-Form/Utils/dateHelpers"
import SendEmailOverlay from "../SendEmailOverlay"
import SuccesOverlay from "../SuccesOverlay"



const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value)

const PriceConfirmation = () => {
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [directApprovalRequested, setDirectApprovalRequested] = useState(false)
  const [directApprovalApprover, setDirectApprovalApprover] = useState<
    "Ricardo" | "Michelle" | null
  >(null)
  const [isDirectApprovalSelectorOpen, setIsDirectApprovalSelectorOpen] =
    useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

const [confirmedUnitPrices, setConfirmedUnitPrices] = useState<Record<number, string>>({})
const [confirmedSuppliers, setConfirmedSuppliers] = useState<Record<number, string>>({})
const [buyerNote, setBuyerNote] = useState("")
const [confirmedDate, setConfirmedDate] = useState("")
const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
const [calendarMonth, setCalendarMonth] = useState(() =>
  getMonthStart(new Date()),
)


const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const { purchaseRequestId: id, token } = useParams<{
  purchaseRequestId: string
  token: string
}>()

const {
  error,
  getPurchaseRequestByToken,
  selectedPurchaseRequest,
  validateBuyerPrice,
  loading,
} = usePurchaseRequests()


useEffect(() => {
  if (!id || !token) return

  getPurchaseRequestByToken(Number(id), token, "validation-prix")
}, [getPurchaseRequestByToken, id, token])



const email = useMemo(() => {
  if (!selectedPurchaseRequest?.requester_email) {
    return null
  }

  return selectedPurchaseRequest.requester_email
}, [selectedPurchaseRequest])

const minExpectedDate = getDateFromToday(0)
const minExpectedDateObject = parseDateInputValue(minExpectedDate)
const selectedDateLabel = formatSelectedDate(confirmedDate)
const neededByDate =
  (
    selectedPurchaseRequest as
      | (typeof selectedPurchaseRequest & { needed_by_date?: string | null })
      | null
  )?.needed_by_date?.slice(0, 10) ?? null
const neededByDateLabel = neededByDate ? formatSelectedDate(neededByDate) : null

const purchaseItems = selectedPurchaseRequest?.items ?? []

const getItemQuantityLabel = (item: (typeof purchaseItems)[number]) => {
  const quantity = item.quantity ?? "Non indiquée"
  const format = item.quantity_format?.trim()

  return format ? `${quantity} ${format}` : String(quantity)
}

const getItemNumberValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  const normalizedValue = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "")

  if (!normalizedValue) {
    return null
  }

  const numberValue = Number(normalizedValue)

  return Number.isFinite(numberValue) ? numberValue : null
}

const getConfirmedUnitPriceForItem = (item: (typeof purchaseItems)[number]) => {
  const typedValue = confirmedUnitPrices[item.id]?.trim()

  if (typedValue) {
    const typedNumber = Number(typedValue)

    return Number.isFinite(typedNumber) ? typedNumber : null
  }

  return (
    getItemNumberValue(item.buyer_confirmed_unit_price) ??
    getItemNumberValue(item.requested_unit_price)
  )
}

const getConfirmedSupplierForItem = (item: (typeof purchaseItems)[number]) => {
  const typedValue = confirmedSuppliers[item.id]?.trim()

  return (
    typedValue ||
    item.buyer_confirmed_supplier ||
    item.requested_supplier ||
    null
  )
}

const getItemQuantityValue = (item: (typeof purchaseItems)[number]) =>
  getItemNumberValue(item.quantity) ?? 1

const getRequestedTotalForItem = (item: (typeof purchaseItems)[number]) => {
  const requestedTotal = getItemNumberValue(item.requested_total_price)

  if (requestedTotal !== null) {
    return requestedTotal
  }

  const requestedUnitPrice = getItemNumberValue(item.requested_unit_price)

  return requestedUnitPrice === null
    ? null
    : requestedUnitPrice * getItemQuantityValue(item)
}

const getConfirmedTotalForItem = (item: (typeof purchaseItems)[number]) => {
  const confirmedUnitPrice = getConfirmedUnitPriceForItem(item)

  if (confirmedUnitPrice !== null) {
    return confirmedUnitPrice * getItemQuantityValue(item)
  }

  return (
    getItemNumberValue(item.buyer_confirmed_total_price) ??
    getRequestedTotalForItem(item)
  )
}

const requestedTotal = purchaseItems.reduce((total, item) => {
  const itemTotal = getRequestedTotalForItem(item)

  return itemTotal === null ? total : total + itemTotal
}, 0)

const confirmedTotal = purchaseItems.reduce((total, item) => {
  const itemTotal = getConfirmedTotalForItem(item)

  return itemTotal === null ? total : total + itemTotal
}, 0)

const hasConfirmedTotal = purchaseItems.some(
  (item) => getConfirmedTotalForItem(item) !== null,
)

const canRequestDirectApproval = hasConfirmedTotal && confirmedTotal < 200



useEffect(() => {
  if (!canRequestDirectApproval) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirectApprovalRequested(false)
    setDirectApprovalApprover(null)
    setIsDirectApprovalSelectorOpen(false)
  }
}, [canRequestDirectApproval])

const selectDirectApprovalApprover = (approver: "Ricardo" | "Michelle") => {
  setDirectApprovalApprover(approver)
  setDirectApprovalRequested(true)
  setHasConfirmed(true)
  setIsDirectApprovalSelectorOpen(false)
}

const selectConfirmedDate = (dateValue: string) => {
  if (
    !isValidIsoDate(dateValue) ||
    parseDateInputValue(dateValue) < minExpectedDateObject
  ) {
    return
  }

  setConfirmedDate(dateValue)
  setCalendarMonth(getMonthStart(parseDateInputValue(dateValue)))
  setIsDatePickerOpen(false)
}

 ///DatePicker ref + handle click outside
const datePickerRef = useRef<HTMLDivElement>(null); 


useEffect(() =>  {

  if(!isDatePickerOpen) return

 const handleClickOutside = (event: MouseEvent | TouchEvent) => {
  const target = event.target as Node


  if(
    datePickerRef.current &&
    !datePickerRef.current.contains(target)
  ) {
    setIsDatePickerOpen(false)
  }
}

  document.addEventListener("mousedown", handleClickOutside)
  document.addEventListener("touchstart", handleClickOutside)

  return () => {
    document.removeEventListener("mousedown", handleClickOutside)
    document.removeEventListener("touchstart", handleClickOutside)
  }

 
},[isDatePickerOpen]);


const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!selectedPurchaseRequest || !id || !token) return

const payload = {
  buyer_user_id: 1,
  expected_date: confirmedDate || null,
  buyer_note: buyerNote.trim() || null,
  direct_approval_requested:
    canRequestDirectApproval && directApprovalRequested && !!directApprovalApprover,
  direct_approval_approver: directApprovalApprover,
  items: purchaseItems.map((item) => ({
    id: item.id,
    buyer_confirmed_unit_price:
      getConfirmedUnitPriceForItem(item) ?? item.requested_unit_price,
    buyer_confirmed_supplier: getConfirmedSupplierForItem(item),
  })),
}

  const updatedRequest = await validateBuyerPrice(Number(id), token, payload)

  if (updatedRequest) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
    setSubmitSuccess(true)

    setTimeout(() => {
      setSubmitSuccess(false)
      window.location.replace("https://vegibec-portail.com/")
    }, 4000)

  }
}

const name = "Ricardo"

const successMessage = "la confirmation de prix a bien été envoyée"

  return (
    <section className="w-full px-4 pb-10 pt-6 tablet:px-8 relative">
           {submitSuccess && 
             
                <SuccesOverlay
                successMessage={successMessage}
                onClose={() => setSubmitSuccess(false)}
                name={name}
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
                  Validation acheteur
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Validation des informations
                </h2>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Vérifiez simplement que le prix proposé et la date demandée semblent raisonnables.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5 py-6 tablet:px-8">
          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>Le prix demandé a ete confirmé.</span>
            </div>
          )}

          {error && !selectedPurchaseRequest && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}

          {selectedPurchaseRequest && 
          <>
          <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
  <div className="flex items-start gap-3">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
      <PackageCheck size={22} aria-hidden="true" />
    </span>

    <div className="min-w-0 flex flex-1 flex-col gap-2">
      <p className="font-bold text-black text-[1.1em]">Demande à vérifier</p>

      <p className="text-sm text-slate-700">
        Demande #{selectedPurchaseRequest.request_reference}
      </p>

      <p className="text-sm text-slate-700">
        {purchaseItems.length} article{purchaseItems.length > 1 ? "s" : ""} à valider
      </p>
    </div>
  </div>

  <dl className="mt-5 grid gap-3 text-sm tablet:grid-cols-3">
    <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
      <dt className="flex items-center gap-2 font-bold text-secondary">
        <User size={16} aria-hidden="true" />
        Demandeur
      </dt>
      <dd className="mt-1 text-slate-700">
        {selectedPurchaseRequest.requested_by || "Non indiqué"}
      </dd>
    </div>

    <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
      <dt className="font-bold text-secondary">Total estimé</dt>
      <dd className="mt-1 text-slate-700">
        {formatCurrency(requestedTotal)}
      </dd>
    </div>

    {/* <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
      <dt className="font-bold text-secondary">Total confirmé</dt>
      <dd className="mt-1 text-slate-700">
        {formatCurrency(confirmedTotal)}
      </dd>
    </div> */}
  </dl>

  <div className="mt-5 flex flex-col gap-4">
    {purchaseItems.map((item) => (
      <div
        key={item.id}
        className="rounded-xl border border-secondary/15 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-secondary">
            Article {item.item_index}
          </p>

          <p className="text-slate-900">
            <span className="font-bold">Produit:</span>
            <br />
            {item.description || "Non indiqué"}
          </p>

          {item.reason && (
            <p className="text-slate-900">
              <span className="font-bold">Justification:</span>
              <br />
              {item.reason}
            </p>
          )}

          {item.product_link && (
            <div className="text-slate-900">
              <p className="font-bold">Lien vers le produit:</p>
              <a
                href={item.product_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-2 rounded-lg border border-secondary/15 bg-white px-3 py-2 text-sm font-bold text-secondary shadow-sm transition hover:border-secondary/35 hover:bg-primary/10"
              >
                <ExternalLink size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate">Voir le produit</span>
              </a>
            </div>
          )}

          <dl className="mt-2 grid gap-3 text-sm tablet:grid-cols-3">
            <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
              <dt className="font-bold text-secondary">Quantité</dt>
              <dd className="mt-1 text-slate-700">{getItemQuantityLabel(item)}</dd>
            </div>

            <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
              <dt className="font-bold text-secondary">Prix unitaire suggéré</dt>
              <dd className="mt-1 text-slate-700">
                {item.requested_unit_price === null
                  ? "Non indiqué"
                  : formatCurrency(Number(item.requested_unit_price))}
              </dd>
            </div>

            <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
              <dt className="font-bold text-secondary">Total suggéré</dt>
              <dd className="mt-1 text-slate-700">
                {item.requested_total_price === null
                  ? "Non indiqué"
                  : formatCurrency(Number(item.requested_total_price))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    ))}
  </div>
</div>
         <div className="grid gap-4">
  <div className="flex items-start gap-3 rounded-lg border border-secondary/15 bg-tertiary/70 px-4 py-3 text-sm leading-6 text-slate-600">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
      i
    </span>

    <p>
      Les champs ci-dessous sont optionnels. Laissez le prix vide pour confirmer
      le prix demandé pour l'article.
    </p>
  </div>

  {purchaseItems.map((item) => (
    <div
      key={item.id}
      className="rounded-xl border border-secondary/15 bg-white p-4 shadow-sm"
    >
      <p className="mb-3 font-black text-secondary">
        Article {item.item_index}
      </p>

      <div className="grid gap-4 tablet:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
          Prix unitaire différent
          <input
            type="number"
            min="0"
            step="0.01"
            value={confirmedUnitPrices[item.id] ?? ""}
            onChange={(e) =>
              setConfirmedUnitPrices((prev) => ({
                ...prev,
                [item.id]: e.target.value,
              }))
            }
            placeholder={
              item.requested_unit_price !== null
                ? String(item.requested_unit_price)
                : "Ex: 25.00"
            }
            className="h-12 rounded-lg border border-secondary/20 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
          />
          <span className="text-xs font-normal text-slate-500">
            Laissez vide pour confirmer le prix demandé.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
          Fournisseur potentiel trouvé
          <input
            type="text"
            value={confirmedSuppliers[item.id] ?? ""}
            onChange={(e) =>
              setConfirmedSuppliers((prev) => ({
                ...prev,
                [item.id]: e.target.value,
              }))
            }
            placeholder={item.requested_supplier || "Optionnel"}
            className="h-12 rounded-lg border border-secondary/20 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
          />
        </label>
      </div>
    </div>
  ))}
</div>
<div className="flex flex-col gap-2 text-sm font-bold text-slate-700" ref={datePickerRef}>
  <span>Changement de la date</span>
  {neededByDateLabel && (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      <span className="font-black">Date demandée initialement : </span>
      <span>{neededByDateLabel}</span>
    </div>
  )}
  <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center">
    <input type="hidden" name="confirmedDate" value={confirmedDate} />

    <div className="relative tablet:flex-1">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-secondary/20 bg-white px-3 text-left text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
        onClick={() => setIsDatePickerOpen((isOpen) => !isOpen)}
        aria-expanded={isDatePickerOpen}
        aria-haspopup="dialog"
      >
        <span className={selectedDateLabel ? "text-slate-900" : "text-slate-400"}>
          {selectedDateLabel || "Choisir une date"}
        </span>
        <Calendar className="shrink-0 text-secondary" size={18} aria-hidden="true" />
      </button>

      {isDatePickerOpen && (
        <DatePicker
          setCalendarMonth={setCalendarMonth}
          calendarMonth={calendarMonth}
          monthFormatter={monthFormatter}
          selectedDate={confirmedDate}
          minDate={minExpectedDateObject}
          selectDate={selectConfirmedDate}
          toDateInputValue={toDateInputValue}
        />
      )}
    </div>

    {confirmedDate && (
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-secondary/25 bg-white px-4 text-sm font-bold text-secondary transition hover:bg-secondary hover:text-white"
        onClick={() => {
          setConfirmedDate("")
          setIsDatePickerOpen(false)
        }}
        aria-label="Effacer la date selectionnee"
      >
        <X size={18} aria-hidden="true" />
        Effacer
      </button>
    )}
  </div>
  <span className="text-xs font-normal text-slate-500">
    Laissez vide pour conserver la date de la demande.
  </span>
</div>

<label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
  Note de l'acheteur
  <textarea
    value={buyerNote}
    onChange={(e) => setBuyerNote(e.target.value)}
    placeholder="Optionnel"
    rows={3}
    className="rounded-lg border border-secondary/20 bg-white px-3 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
  />
</label> 
          

          <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-secondary/15 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:border-secondary/35 hover:bg-primary/10">
            <input
              className="filter-checkbox-input"
              type="checkbox"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              required
            />
            <span
              className={`filter-checkbox-visual ${
                hasConfirmed
                  ? "filter-checkbox-visual--checked"
                  : "filter-checkbox-visual--unchecked"
              }`}
              aria-hidden="true"
            >
              <svg
                className="filter-checkbox-check"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M5 12.5 9.5 17 19 7" />
              </svg>
            </span>
            <span className="leading-6">
              Je confirme que les prix proposés semblent raisonnables pour les produits
              demandés.
            </span>
          </label>

          {canRequestDirectApproval && (
            <div className="flex flex-col gap-3">
            <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-secondary/15 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:border-secondary/35 hover:bg-primary/10">
              <input
                className="filter-checkbox-input"
                type="checkbox"
                checked={directApprovalRequested}
                onChange={(e) => {
                  if (e.target.checked) {
                    setIsDirectApprovalSelectorOpen(true)
                    return
                  }

                  setDirectApprovalRequested(false)
                  setDirectApprovalApprover(null)
                  setIsDirectApprovalSelectorOpen(false)
                }}
              />
              <span
                className={`filter-checkbox-visual ${
                  directApprovalRequested
                    ? "filter-checkbox-visual--checked"
                    : "filter-checkbox-visual--unchecked"
                }`}
                aria-hidden="true"
              >
                <svg
                  className="filter-checkbox-check"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M5 12.5 9.5 17 19 7" />
                </svg>
              </span>
              <span className="leading-6">
                Cette demande peut être approuvée directement.
              </span>
            </label>
            {directApprovalApprover && (
              <p className="px-4 text-xs font-bold text-secondary">
                Approuvée par {directApprovalApprover}
              </p>
            )}
            {isDirectApprovalSelectorOpen && (
              <div className="rounded-lg border border-secondary/20 bg-tertiary/70 px-4 py-3 shadow-sm">
                <p className="text-sm font-bold text-slate-700">
                  Qui approuve directement cette demande?
                </p>
                <div className="mt-3 grid gap-2 tablet:grid-cols-2">
                  {(["Ricardo", "Michelle"] as const).map((approver) => (
                    <button
                      key={approver}
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-secondary/25 bg-white px-4 text-sm font-black text-secondary transition hover:bg-secondary hover:text-white focus:outline-none focus:ring-4 focus:ring-primary/30"
                      onClick={() => selectDirectApprovalApprover(approver)}
                    >
                      {approver}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
          </>
          }
        </div>

        <div className="flex flex-col gap-4 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-8">
          <div className="max-w-md">
            <p className="text-sm font-bold text-slate-700">
              Validation de la demande
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Si des informations manquent, contactez le demandeur. Sinon,
              confirmez que le prix semble raisonnable.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 tablet:w-auto tablet:min-w-72">
            {email && (
    <button
      type="button"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#C9A227]/35 bg-white px-6 font-black text-[#7A5D00] shadow-sm transition hover:cursor-pointer hover:bg-[#fff7dc] focus:outline-none focus:ring-4 focus:ring-[#C9A227]/25"
      onClick={() => setIsOverlayOpen(true)}
    >
      <Mail size={18} aria-hidden="true" />
      Demander de l'information
    </button>
  )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-6 font-black text-white shadow-lg shadow-secondary/20 transition hover:cursor-pointer hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Send size={18} aria-hidden="true" />
            {loading
              ? "Envoi en cours..."
              : directApprovalRequested
                ? "Confirmer et approuver"
                : "Valider les informations"}
          </button>
        </div>  


        </div>
      </form>
      {isOverlayOpen && email && (
        <SendEmailOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          emailSendTo={email}
          
        />
      )}
      {submitSuccess && <p className="mt-4 text-green-600 text-[1.2em]">Le prix a bien été confirmé.</p>}
    </section>
  )
}

export default PriceConfirmation
