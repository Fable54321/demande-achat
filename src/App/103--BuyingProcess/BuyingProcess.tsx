import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  useBuying,
  type CreatePurchaseOrderResponse,
  type PurchaseMode,
} from "../../Contexts/BuyingContext"
import BuyingHeader from "./Components/BuyingHeader"
import BuyingRequestSummary from "./Components/BuyingRequestSummary"
import PurchaseOrderGroupCard from "./Components/PurchaseOrderGroupCard"
import BuyingSubmitBar from "./Components/BuyingSubmitBar"
import SuccesOverlay from "../SuccesOverlay"
import { createEmptyGroup } from "./Utils/buyingHelpers"
import { buildCreatePurchaseOrderPayload } from "./Utils/buyingPayload"
import type { PurchaseOrderGroupForm } from "./Utils/buyingTypes"

const PURCHASE_TRACKING_URL = "https://vegibec-portail.com/suivi-des-achats"
const SUCCESS_REDIRECT_DELAY_MS = 5000

type CreatedPurchaseOrderJournalEntry = {
  id: number
  reference: string
  supplierName: string | null
  pdfUrl: string | null
}

const getPurchaseOrderPdfUrl = (result: CreatePurchaseOrderResponse) =>
  result.purchase_order_pdf?.url ?? result.purchase_order_pdf_urls?.[0] ?? null

const BuyingProcess = () => {
  const { id, token } = useParams<{ id: string; token: string }>()

  const {
    buyingRequest,
    suppliers,
    loading,
    error,
    fetchBuyingRequestByToken,
    fetchSuppliers,
    createPurchaseOrder,
  } = useBuying()

  
  const [groups, setGroups] = useState<PurchaseOrderGroupForm[]>([
    createEmptyGroup(),
  ])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [createdPurchaseOrders, setCreatedPurchaseOrders] = useState<
    CreatedPurchaseOrderJournalEntry[]
  >([])
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!id || !token) return

    fetchBuyingRequestByToken(Number(id), token)
    fetchSuppliers()
  }, [id, token, fetchBuyingRequestByToken, fetchSuppliers])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const requestItems = useMemo(() => {
    return buyingRequest?.items ?? []
  }, [buyingRequest])

  const activeGroups = useMemo(() => {
    return groups.filter((group) => group.items.length > 0)
  }, [groups])

  const addGroup = () => {
    setGroups((prev) => [...prev, createEmptyGroup()])
  }

  const removeGroup = (localId: string) => {
    setGroups((prev) =>
      prev.length === 1 ? prev : prev.filter((group) => group.localId !== localId),
    )
  }

  const updateGroup = (
    localId: string,
    updatedGroup: PurchaseOrderGroupForm,
  ) => {
    setGroups((prev) =>
      prev.map((group) => (group.localId === localId ? updatedGroup : group)),
    )
  }


  const selectedRequestItemIds = useMemo(() => {
  return new Set(
    groups.flatMap((group) =>
      group.items.map((item) => item.purchase_request_item_id),
    ),
  )
}, [groups])

const purchaseMode: PurchaseMode = useMemo(() => {
  if (requestItems.length === 0) return "partial"

  const allItemsSelected = requestItems.every((item) =>
    selectedRequestItemIds.has(item.id),
  )

  return allItemsSelected ? "full" : "partial"
}, [requestItems, selectedRequestItemIds])

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    setCreatedPurchaseOrders([])

    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }

    if (!id || !token) {
      setSubmitError("Lien d'achat invalide.")
      return
    }

    if (activeGroups.length === 0) {
      setSubmitError("Ajoutez au moins un article à acheter.")
      return
    }

   const createdOrders: CreatedPurchaseOrderJournalEntry[] = []

   for (const [index, group] of activeGroups.entries()) {
  const isLastGroup = index === activeGroups.length - 1

  const groupPurchaseMode =
    purchaseMode === "full" && isLastGroup ? "full" : "partial"

  const payload = buildCreatePurchaseOrderPayload(group, groupPurchaseMode)

  const result = await createPurchaseOrder(Number(id), token, payload)

  if (!result) {
    setSubmitError("Erreur lors de la création d'un bon d'achat.")
    return
  }

  createdOrders.push({
    id: result.purchase_order.id,
    reference: result.purchase_order.purchase_order_reference,
    supplierName: result.purchase_order.supplier_name,
    pdfUrl: getPurchaseOrderPdfUrl(result),
  })
}

    window.scrollTo({ top: 0, behavior: "smooth" })
    setCreatedPurchaseOrders(createdOrders)
    setSubmitSuccess(true)

    redirectTimerRef.current = window.setTimeout(() => {
      window.location.href = PURCHASE_TRACKING_URL
    }, SUCCESS_REDIRECT_DELAY_MS)
  }

  if (loading && !buyingRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6">
        Chargement...
      </main>
    )
  }

  if (error && !buyingRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6 text-red-700">
        {error}
      </main>
    )
  }

  if (!buyingRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6">
        Demande introuvable.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-tertiary px-4 py-6">
      {submitSuccess && (
        <SuccesOverlay successMessage="Le ou les bons d'achat ont été créés avec succès." onClose={() => setSubmitSuccess(false)} name="Ricardo" />
      )}

      <div className="mx-auto max-w-6xl space-y-6">
        {createdPurchaseOrders.length > 0 && (
          <section className="rounded-2xl border border-[#4B7312]/30 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#4B7312]">
                  Bons d'achat crees ({createdPurchaseOrders.length})
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {createdPurchaseOrders.length > 1
                    ? "Cette demande contient plusieurs bons d'achat. Chaque reference ci-dessous correspond a un bon distinct."
                    : "Bon d'achat cree pour cette demande."}
                </p>
              </div>
              <p className="rounded-full bg-[#4B7312]/10 px-3 py-1 text-sm font-semibold text-[#4B7312]">
                Redirection dans 5 secondes
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {createdPurchaseOrders.map((purchaseOrder, index) => (
                <div
                  key={purchaseOrder.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Bon {index + 1} de {createdPurchaseOrders.length}
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 wrap-anywhere">
                        {purchaseOrder.reference}
                      </p>
                      {purchaseOrder.supplierName && (
                        <p className="mt-1 text-sm text-slate-600 wrap-anywhere">
                          Fournisseur: {purchaseOrder.supplierName}
                        </p>
                      )}
                    </div>

                    {purchaseOrder.pdfUrl ? (
                      <a
                        href={purchaseOrder.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#4B7312] px-4 py-2 text-sm font-bold text-white hover:bg-[#3d5f0f]"
                      >
                        Ouvrir le PDF
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">
                        PDF non disponible
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <BuyingHeader purchaseRequest={buyingRequest} />

        <BuyingRequestSummary purchaseRequest={buyingRequest} />
{groups.map((group, index) => {
  const selectedItemIdsInOtherGroups = new Set(
    groups
      .filter((currentGroup) => currentGroup.localId !== group.localId)
      .flatMap((currentGroup) =>
        currentGroup.items.map((item) => item.purchase_request_item_id),
      ),
  )

  return (
    <PurchaseOrderGroupCard
      key={group.localId}
      group={group}
      groupIndex={index}
      suppliers={suppliers}
      requestItems={requestItems}
      purchaseMode={purchaseMode}
      selectedItemIdsInOtherGroups={selectedItemIdsInOtherGroups}
      canRemove={groups.length > 1}
      onChange={(updatedGroup) =>
        updateGroup(group.localId, updatedGroup)
      }
      onRemove={() => removeGroup(group.localId)}
    />
  )
})}

    <section className="rounded-2xl bg-white p-4 shadow-sm">


  <p className="mt-1 text-lg font-bold text-[#4B7312]">
    {purchaseMode === "full" ? "Achat complet" : "Achat partiel"}
  </p>

  <p className="mt-1 text-sm text-slate-600">
    {selectedRequestItemIds.size} article
    {selectedRequestItemIds.size > 1 ? "s" : ""} sélectionné
    {selectedRequestItemIds.size > 1 ? "s" : ""} sur {requestItems.length}
  </p>
</section>
    

        <section className="space-y-4">
        

          
            <button
              type="button"
              onClick={addGroup}
              className="rounded-xl border border-dashed border-[#4B7312] px-4 py-3 text-sm font-semibold text-[#4B7312] hover:bg-white"
            >
              + Ajouter un autre bon d'achat
            </button>
          
        </section>

        <BuyingSubmitBar
          loading={loading}
          error={submitError}
          disabled={activeGroups.length === 0}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}

export default BuyingProcess
