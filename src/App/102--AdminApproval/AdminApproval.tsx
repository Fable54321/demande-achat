import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Mail,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
} from "lucide-react"

import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import { useEffect, useState, useMemo } from "react"
import SendEmailOverlay from "../SendEmailOverlay"
import SuccesOverlay from "../SuccesOverlay"

type AdminDecision = "approved" | "rejected" | "on_wait" | null

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value)

const AdminApproval = () => {
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { id, token } = useParams<{
  id: string
  token: string
}>()

const {
  error,
  selectedPurchaseRequest,
  saveAdminDecision,
  getPurchaseRequestByToken,
  loading,
} = usePurchaseRequests()
const [adminDecision, setAdminDecision] = useState<AdminDecision>(null)
const [refuseReason, setRefuseReason] = useState("")
const [waitReason, setWaitReason] = useState("")
  const note = "";
  const email = selectedPurchaseRequest?.requester_email ?? null

  const purchaseItems = useMemo(() => {
  return selectedPurchaseRequest?.items ?? []
}, [selectedPurchaseRequest?.items])

const getNumberValue = (value: unknown) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const formatOptionalCurrency = (value: unknown) => {
  const numberValue = getNumberValue(value)

  return numberValue === null ? "Non indiqué" : formatCurrency(numberValue)
}

const getItemQuantityLabel = (item: (typeof purchaseItems)[number]) => {
  const quantity = item.quantity ?? "Non indiquée"
  const format = item.quantity_format?.trim()

  return format ? `${quantity} ${format}` : String(quantity)
}

const requestedTotal = useMemo(() => {
  return purchaseItems.reduce((total, item) => {
    const itemTotal = getNumberValue(item.requested_total_price)

    return itemTotal === null ? total : total + itemTotal
  }, 0)
}, [purchaseItems])

const confirmedTotal = useMemo(() => {
  return purchaseItems.reduce((total, item) => {
    const itemTotal = getNumberValue(item.buyer_confirmed_total_price)

    return itemTotal === null ? total : total + itemTotal
  }, 0)
}, [purchaseItems])

useEffect(() => {
  if (!id || !token) return

  getPurchaseRequestByToken(Number(id), token, "approbation-achat")
},[getPurchaseRequestByToken, id, token]);

useEffect(() => {
  if (selectedPurchaseRequest?.status !== "admin_on_wait") return

  setAdminDecision("on_wait")
  setWaitReason(selectedPurchaseRequest.admin_note ?? "")
}, [selectedPurchaseRequest?.admin_note, selectedPurchaseRequest?.status])
  

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setSubmitError(null)
  setSubmitSuccess(false)

  if (!selectedPurchaseRequest || !id || !token || !adminDecision) {
    setSubmitError("Veuillez choisir une décision.")
    return
  }

  if (adminDecision === "rejected" && !refuseReason.trim()) {
    setSubmitError("La raison du refus est requise.")
    return
  }

  if (adminDecision === "on_wait" && !waitReason.trim()) {
    setSubmitError("La raison de la mise en attente est requise.")
    return
  }

  const payload = {
    decision: adminDecision,
    admin_note:
      adminDecision === "on_wait"
        ? waitReason.trim()
        : note.trim() || null,
    rejection_reason:
      adminDecision === "rejected" ? refuseReason.trim() : null,
  }

  const updatedRequest = await saveAdminDecision(Number(id), token, payload)

  if (updatedRequest) {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setSubmitSuccess(true)

    if (adminDecision !== "on_wait") {
      setTimeout(() => {
        setSubmitSuccess(false)
        window.location.replace("https://vegibec-portail.com/")
      }, 4000)
    }
  }
}

const name = "Michelle";
const successMessage = adminDecision === "on_wait"
  ? "la demande a été mise en attente; ce lien restera accessible"
  : "la décision a bien été envoyée";

  return (
    <section className="w-full px-4 pb-10 pt-6 tablet:px-8 ">
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
                  Approbation d'achat par l'administration
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Approbation pour achat
                </h2>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              S'assurer que la demande d'achat est justifiée.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-5 py-6 tablet:px-8">
          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>La décision a été envoyée.</span>
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {error && !selectedPurchaseRequest && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}

          {selectedPurchaseRequest && (
  <>
  {selectedPurchaseRequest.status === "admin_on_wait" && (
    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
      <AlertCircle className="mt-0.5 shrink-0" size={18} />
      <span>
        Cette demande est en attente. Ce lien reste actif et vous pouvez modifier
        la décision ci-dessous.
      </span>
    </div>
  )}
  <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
        <PackageCheck size={22} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex flex-1 flex-col gap-2">
        <p className="font-bold text-black text-[1.1em]">
          Demande à approuver
        </p>

        <p className="text-sm text-slate-700">
          Demande #{selectedPurchaseRequest.request_reference}
        </p>

        <p className="text-sm text-slate-700">
          {purchaseItems.length} article{purchaseItems.length > 1 ? "s" : ""}
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
        <dt className="flex items-center gap-2 font-bold text-secondary">
          <DollarSign size={16} aria-hidden="true" />
          Total estimé
        </dt>
        <dd className="mt-1 text-slate-700">
          {formatCurrency(requestedTotal)}
        </dd>
      </div>

      <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
        <dt className="font-bold text-secondary">
          Total confirmé par l'acheteur
        </dt>
        <dd className="mt-1 text-slate-700">
          {formatCurrency(confirmedTotal)}
        </dd>
      </div>
    </dl>

    <div className="mt-5 flex flex-col gap-4">
      {purchaseItems.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-secondary/15 bg-white p-4 shadow-sm"
        >
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-secondary">
              Article {item.item_index}
            </p>

            <p className="whitespace-pre-wrap text-slate-900 [overflow-wrap:anywhere]">
              <span className="font-bold">Produit:</span>
              <br />
              {item.description || "Non indiqué"}
            </p>

            {item.reason && (
              <p className="whitespace-pre-wrap text-slate-900 [overflow-wrap:anywhere]">
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
                  Voir le produit
                </a>
              </div>
            )}

            <dl className="mt-2 grid gap-3 text-sm tablet:grid-cols-4">
              <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                <dt className="font-bold text-secondary">Quantité</dt>
                <dd className="mt-1 text-slate-700">
                  {getItemQuantityLabel(item)}
                </dd>
              </div>

              <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                <dt className="font-bold text-secondary">Prix demandé</dt>
                <dd className="mt-1 text-slate-700">
                  {formatOptionalCurrency(item.requested_unit_price)}
                </dd>
              </div>

              <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                <dt className="font-bold text-secondary">Prix confirmé</dt>
                <dd className="mt-1 text-slate-700">
                  {formatOptionalCurrency(item.buyer_confirmed_unit_price)}
                </dd>
              </div>

              <div className="rounded-lg border border-secondary/10 bg-tertiary/50 px-3 py-2">
                <dt className="font-bold text-secondary">Total confirmé</dt>
                <dd className="mt-1 text-slate-700">
                  {formatOptionalCurrency(item.buyer_confirmed_total_price)}
                </dd>
              </div>
            </dl>

            {item.buyer_confirmed_supplier && (
              <p className="text-sm text-slate-700">
                <span className="font-bold text-secondary">
                  Fournisseur potentiel:
                </span>{" "}
                {item.buyer_confirmed_supplier}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
  </>
)}
          
         
        </div>

        <div className="flex flex-col gap-3 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:items-center tablet:justify-between tablet:px-8">
         <div className="flex flex-col gap-3">
  <p className=" font-bold text-slate-700">
    Décision administrative
  </p>

  <div className="grid gap-3 tablet:grid-cols-2">
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition ${
        adminDecision === "approved"
          ? "border-green-500 bg-green-50 text-green-900"
          : "border-secondary/15 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      <input
        type="radio"
        name="adminDecision"
        value="approved"
     checked={adminDecision === "approved"}
onChange={() => {
  setAdminDecision("approved")
  setSubmitError(null)
}}
        className="mt-1 h-4 w-4 accent-green-700"
        required
      />

      <span className="flex flex-col gap-1">
        <span className="font-black">Autoriser l'achat</span>
        <span className="text-xs leading-5 text-slate-500">
          L'acheteur pourra procéder à l'achat.
        </span>
      </span>
    </label>

   <div   className={`flex flex-col gap-2  items-start row-span-2 rounded-lg border px-4 py-3  shadow-sm transition ${
        adminDecision === "on_wait"
          ? "border-orange-400 bg-orange-50"
          : "border-secondary/15 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50"
      }`}>
    <label
    className="flex gap-3 cursor-pointer"
    >
      <input
        type="radio"
        name="adminDecision"
        value="onWait"
      checked={adminDecision === "on_wait"}
onChange={() => {
  setAdminDecision("on_wait")
  setSubmitError(null)
}}
        className="mt-1 h-4 w-4 accent-orange-700"
        required
      />

      <span className="flex flex-col gap-1">
        <span className="font-black">Mise en attente / autre</span>
        
      </span>
    </label>
    <label className="w-full h-full">
      <span className="hidden">Raison de la mise en attente</span>
  <textarea
  value={waitReason}
  onChange={(event) => {
    setWaitReason(event.target.value)
    setSubmitError(null)
  }}
  className="bg-white border border-gray-300 rounded-lg resize-none w-full h-full focus:outline-gray-300 px-2 py-0.5"
  placeholder="Raison de la mise en attente"
  disabled={adminDecision !== "on_wait"}
/>
        
     
    </label>
</div>  

    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition ${
        adminDecision === "rejected"
          ? "border-red-500 bg-red-50 text-red-900"
          : "border-secondary/15 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50"
      }`}
    >
      <input
        type="radio"
        name="adminDecision"
        value="rejected"
       checked={adminDecision === "rejected"}
onChange={() => {
  setAdminDecision("rejected")
  setSubmitError(null)
}}
        className="mt-1 h-4 w-4 accent-red-700"
        required
      />

      <span className="flex flex-col gap-1">
        <span className="font-black">Refuser l'achat</span>
        <span className="text-xs leading-5 text-slate-500">
          La demande sera refusée et aucun achat ne devra être fait.
        </span>
      </span>
    </label>
  </div>

  {adminDecision === "rejected" && (
    <label className="flex flex-col gap-2  font-bold text-slate-700">
      Raison du refus
      <textarea
        value={refuseReason}
        onChange={(event) => {
          setRefuseReason(event.target.value)
          setSubmitError(null)
        }}
        rows={4}
        required
        placeholder="Expliquez pourquoi la demande est refusée."
        className="min-h-28 resize-y rounded-lg border border-secondary/20 bg-white px-3 py-3 font-semibold leading-6 text-slate-800 shadow-sm outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-secondary focus:ring-4 focus:ring-primary/20"
      />
    </label>
  )}
</div>

          <div className="flex flex-col gap-4 rounded-lg border border-secondary/10 bg-white px-4 py-4 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="max-w-md">
              <p className="text-sm font-bold text-slate-700">
                Finaliser la décision
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Si des informations manquent, contactez le demandeur. Sinon,
                confirmez la décision administrative.
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
    {loading ? "Envoi en cours" : "Confirmer la décision"}
  </button>
</div>
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
    </section>
  )
}

export default AdminApproval
