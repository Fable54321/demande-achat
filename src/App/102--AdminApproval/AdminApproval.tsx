import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
} from "lucide-react"

import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import { useEffect, useState } from "react"
import SendEmailOverlay from "../SendEmailOverlay"



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

  const { selectedPurchaseRequest, saveAdminDecision, fetchPurchaseRequestById } = usePurchaseRequests();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [refuseReason, setRefuseReason] = useState("")
  const note = "";
  const email = selectedPurchaseRequest?.request_email ?? null

useEffect(() => {
    fetchPurchaseRequestById(Number(id));
},[id]);
  

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setSubmitError(null)
  setSubmitSuccess(false)

  if (!selectedPurchaseRequest || !id || !token || isApproved === null) return

  if (!isApproved && !refuseReason.trim()) {
    setSubmitError("La raison du refus est requise.")
    return
  }

  const payload = {
    approved: isApproved,
    admin_note: note,
    rejection_reason: isApproved ? null : refuseReason.trim(),
  }

  const updatedRequest = await saveAdminDecision(Number(id), token, payload)

  if (updatedRequest) {
    setSubmitSuccess(true)
  }
}

  return (
    <section className="w-full px-4 pb-10 pt-6 tablet:px-8 ">
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
              <span>Le prix demandé a ete confirmé.</span>
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {selectedPurchaseRequest && 
        
          <div className="rounded-xl border border-secondary/15 bg-tertiary/70 p-4 tablet:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
                <PackageCheck size={22} aria-hidden="true" />
              </span>
              <div className=" min-w-0 flex flex-col gap-2">
                <p className="font-bold text-black text-[1.1em]">Demande à vérifier</p>
                
                   
                  {selectedPurchaseRequest?.description && <p className="mt-1 ml-2 leading-6 text-slate-900"><span className="font-bold">Produit:</span> <br/> {selectedPurchaseRequest.description}</p>}
                
                {selectedPurchaseRequest?.reason && <p className="mt-1 ml-2 leading-6 text-slate-900" ><span className="font-bold">Justification:</span> <br/> {selectedPurchaseRequest.reason}</p>}
              </div>
            </div>

            <dl className="mt-5 flex flex-col gap-3  ">
             <div className="flex gap-3 w-full">  
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm flex-1">
                <dt className="flex items-center gap-2 font-bold text-secondary">
                  <User size={16} aria-hidden="true" />
                  Demandeur
                </dt>
                <dd className="mt-1 text-slate-700">
                  {selectedPurchaseRequest?.requested_by && selectedPurchaseRequest.requested_by}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm flex-1">
                <dt className="font-bold text-secondary">Quantité</dt>
                <dd className="mt-1 text-slate-700">
                  {selectedPurchaseRequest?.quantity && selectedPurchaseRequest.quantity}
                </dd>
              </div>
             </div>
             <div className="flex gap-3 w-full"> 
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm flex-1">
                <dt className="flex items-center gap-2 font-bold text-secondary">
                  <DollarSign size={16} aria-hidden="true" />
                  Prix unitaire (confirmé par l'acheteur)
                </dt>
                <dd className="mt-1 text-slate-700">
                  { selectedPurchaseRequest?.buyer_confirmed_unit_price && formatCurrency(selectedPurchaseRequest.buyer_confirmed_unit_price)}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm flex-1">
                <dt className="font-bold text-secondary">Prix total (confirmé par l'acheteur)</dt>
                <dd className="mt-1 text-slate-700">
                  {selectedPurchaseRequest?.buyer_confirmed_total_price &&   formatCurrency(selectedPurchaseRequest.buyer_confirmed_total_price)}
                </dd>
              </div>
              </div> 
            </dl>
          </div>
}
          
         
        </div>

        <div className="flex flex-col gap-3 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:items-center tablet:justify-between tablet:px-8">
         <div className="flex flex-col gap-3">
  <p className=" font-bold text-slate-700">
    Décision administrative
  </p>

  <div className="grid gap-3 tablet:grid-cols-2">
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition ${
        isApproved === true
          ? "border-green-500 bg-green-50 text-green-900"
          : "border-secondary/15 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      <input
        type="radio"
        name="adminDecision"
        value="approved"
        checked={isApproved === true}
        onChange={() => {
          setIsApproved(true)
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

    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition ${
        isApproved === false
          ? "border-red-500 bg-red-50 text-red-900"
          : "border-secondary/15 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50"
      }`}
    >
      <input
        type="radio"
        name="adminDecision"
        value="rejected"
        checked={isApproved === false}
        onChange={() => {
          setIsApproved(false)
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

  {isApproved === false && (
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

          <div className="flex flex-col gap-1">
            {email && (
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-6 font-black text-white shadow-lg shadow-secondary/20 transition hover:cursor-pointer hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30"
                onClick={() => setIsOverlayOpen(true)}
              >
                <Send size={18} aria-hidden="true" />
                Communiquer avec le demandeur
              </button>
            )}

            <button
              type="submit"
              className="inline-flex h-12 mx-auto items-center justify-center gap-2 rounded-lg bg-secondary px-6 font-black text-white shadow-lg shadow-secondary/20 transition hover:cursor-pointer hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              <Send size={18} aria-hidden="true" />
              Confirmer la décision
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
    </section>
  )
}

export default AdminApproval
