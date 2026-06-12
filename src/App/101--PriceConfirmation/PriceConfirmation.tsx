import {
  CheckCircle2,
  DollarSign,
  Mail,
  PackageCheck,
  Send,
  ShoppingBag,
  User,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import SendEmailOverlay from "../SendEmailOverlay"
import SuccesOverlay from "../SuccesOverlay"



const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-CA", {
    currency: "CAD",
    style: "currency",
  }).format(value)

const PriceConfirmation = () => {
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [confirmedUnitPrice, setConfirmedUnitPrice] = useState("")
const [confirmedSupplier, setConfirmedSupplier] = useState("")
const [buyerNote, setBuyerNote] = useState("")


const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const { purchaseRequestId: id, token } = useParams<{
  purchaseRequestId: string
  token: string
}>()

  const { fetchPurchaseRequestById, selectedPurchaseRequest, validateBuyerPrice, loading } = usePurchaseRequests();

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {fetchPurchaseRequestById(Number(id));}, [id]);

useEffect(()=> {console.log(selectedPurchaseRequest)}, [selectedPurchaseRequest]);

const email = useMemo(() => {

  if(!selectedPurchaseRequest) {
    return
  }

  if (selectedPurchaseRequest.request_email) {
    return selectedPurchaseRequest.request_email
  }
  return null
},[selectedPurchaseRequest]);

  

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!selectedPurchaseRequest || !id || !token) return

  const existingUnitPrice = selectedPurchaseRequest.requested_unit_price

  const finalConfirmedUnitPrice =
    confirmedUnitPrice.trim() === ""
      ? existingUnitPrice
      : Number(confirmedUnitPrice)

  const payload = {
    buyer_user_id: 1, // temporary, or your buyer user id
    buyer_confirmed_unit_price: finalConfirmedUnitPrice,
    buyer_confirmed_supplier: confirmedSupplier.trim() || null,
    buyer_note: buyerNote.trim() || null,
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
                  Confirmation de prix
                </h2>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Vérifiez simplement que le prix proposé semble raisonnable.
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

          {selectedPurchaseRequest && 
          <>
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

            <dl className="mt-5 grid gap-3 text-sm tablet:grid-cols-4">
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="flex items-center gap-2 font-bold text-secondary">
                  <User size={16} aria-hidden="true" />
                  Demandeur
                </dt>
                <dd className="mt-1 text-slate-700">
                  {selectedPurchaseRequest?.requested_by && selectedPurchaseRequest.requested_by}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="font-bold text-secondary">Quantité</dt>
                <dd className="mt-1 text-slate-700">
                  {selectedPurchaseRequest?.quantity && selectedPurchaseRequest.quantity}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="flex items-center gap-2 font-bold text-secondary">
                  <DollarSign size={16} aria-hidden="true" />
                  Prix unitaire
                </dt>
                <dd className="mt-1 text-slate-700">
                  { selectedPurchaseRequest?.requested_unit_price && formatCurrency(selectedPurchaseRequest.requested_unit_price)}
                </dd>
              </div>
              <div className="rounded-lg border border-secondary/15 bg-white px-3 py-2 shadow-sm">
                <dt className="font-bold text-secondary">Total demandé</dt>
                <dd className="mt-1 text-slate-700">
                  {selectedPurchaseRequest?.requested_total_price &&   formatCurrency(selectedPurchaseRequest.requested_total_price)}
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="grid gap-4 tablet:grid-cols-2">
<div className="flex items-start gap-3 rounded-lg border border-secondary/15 bg-tertiary/70 px-4 py-3 text-sm leading-6 text-slate-600 tablet:col-span-2">
  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
    i
  </span>

  <p>
    La section ci-dessous n'est pas obligatoire, mais permet de garder en banque
    certaines infos qui auraient déjà été trouvées.
  </p>
</div>

  <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
    Prix unitaire différent
    <input
      type="number"
      min="0"
      step="0.01"
      value={confirmedUnitPrice}
      onChange={(e) => setConfirmedUnitPrice(e.target.value)}
      placeholder={
        selectedPurchaseRequest?.requested_unit_price
          ? String(selectedPurchaseRequest.requested_unit_price)
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
      value={confirmedSupplier}
      onChange={(e) => setConfirmedSupplier(e.target.value)}
      placeholder="Optionnel"
      className="h-12 rounded-lg border border-secondary/20 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-primary/20"
    />
  </label>
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
        </>  
          }

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
              Je confirme que le prix proposé semble raisonnable pour le produit
              demandé.
            </span>
          </label>
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
            {loading ?  "Envoi en cours..." : "Confirmer le prix"}
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
