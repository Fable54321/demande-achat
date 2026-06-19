import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useBuying, type PurchaseMode } from "../../Contexts/BuyingContext"
import BuyingHeader from "./Components/BuyingHeader"
import BuyingRequestSummary from "./Components/BuyingRequestSummary"
import PurchaseOrderGroupCard from "./Components/PurchaseOrderGroupCard"
import BuyingSubmitBar from "./Components/BuyingSubmitBar"
import SuccesOverlay from "../SuccesOverlay"
import { createEmptyGroup } from "./Utils/buyingHelpers"
import { buildCreatePurchaseOrderPayload } from "./Utils/buyingPayload"
import type { PurchaseOrderGroupForm } from "./Utils/buyingTypes"

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

  useEffect(() => {
    if (!id || !token) return

    fetchBuyingRequestByToken(Number(id), token)
    fetchSuppliers()
  }, [id, token, fetchBuyingRequestByToken, fetchSuppliers])

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

    if (!id || !token) {
      setSubmitError("Lien d'achat invalide.")
      return
    }

    if (activeGroups.length === 0) {
      setSubmitError("Ajoutez au moins un article à acheter.")
      return
    }

    for (const group of activeGroups) {
      const payload = buildCreatePurchaseOrderPayload(group, purchaseMode)

      const result = await createPurchaseOrder(Number(id), token, payload)

      if (!result) {
        setSubmitError("Erreur lors de la création d'un bon d'achat.")
        return
      }
    }

    setSubmitSuccess(true)
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