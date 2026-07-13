import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useEditablePurchaseRequests } from "../../Contexts/EditablePurchaseRequestContext"

type ModifyEditableRequestPanelProps = {
  requestId: number
  requesterEmail: string
  onBack: () => void
  onDone: () => void
}

type EditableItemFormState = {
  id: number
  description: string
  reason: string
  quantity: string
  quantity_format: string
  requested_unit_price: string
  requested_supplier: string
  product_link: string
}

const ModifyEditableRequestPanel = ({
  requestId,
  requesterEmail,
  onBack,
  onDone,
}: ModifyEditableRequestPanelProps) => {
  const {
    fetchEditableRequestDetail,
    modifyEditablePurchaseRequest,
    editableRequestDetail,
    isLoadingEditableRequestDetail,
    isModifyingEditableRequest,
    editableRequestError,
    clearEditableRequestDetail,
  } = useEditablePurchaseRequests()

  const [requestedBy, setRequestedBy] = useState("")
  const [neededByDate, setNeededByDate] = useState("")
  const [modificationReason, setModificationReason] = useState("")
  const [items, setItems] = useState<EditableItemFormState[]>([])

  useEffect(() => {
    let isMounted = true

    const loadDetail = async () => {
      try {
        const detail = await fetchEditableRequestDetail(
          requestId,
          requesterEmail,
        )

        if (!isMounted) return

        setRequestedBy(detail.request.requested_by ?? "")

        setNeededByDate(
          detail.request.needed_by_date
            ? detail.request.needed_by_date.slice(0, 10)
            : "",
        )

        setItems(
          detail.items.map((item) => ({
            id: item.id,
            description: item.description ?? "",
            reason: item.reason ?? "",
            quantity: String(item.quantity ?? ""),
            quantity_format: item.quantity_format ?? "",
            requested_unit_price: String(item.requested_unit_price ?? ""),
            requested_supplier: item.requested_supplier ?? "",
            product_link: item.product_link ?? "",
          })),
        )
      } catch {
        // Error is already handled in context
      }
    }

    loadDetail()

    return () => {
      isMounted = false
      clearEditableRequestDetail()
    }
  }, [
    requestId,
    requesterEmail,
    fetchEditableRequestDetail,
    clearEditableRequestDetail,
  ])

  const requestReference =
    editableRequestDetail?.request.request_reference ?? String(requestId)

  const parseNumber = (value: string) => Number(value.trim().replace(",", "."))

  const validationError = useMemo(() => {
    if (modificationReason.trim().length < 3) {
      return "Veuillez indiquer une raison de modification d’au moins 3 caractères."
    }

    if (items.length === 0) return "La demande doit contenir au moins un article."

    const invalidItemIndex = items.findIndex((item) => {
      const quantity = parseNumber(item.quantity)
      const unitPrice = parseNumber(item.requested_unit_price || "0")

      return !(
        item.description.trim().length > 0 &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        Number.isFinite(unitPrice) &&
        unitPrice >= 0
      )
    })

    if (invalidItemIndex >= 0) {
      return `Vérifiez la description, la quantité et le prix de l’article ${invalidItemIndex + 1}.`
    }

    return null
  }, [items, modificationReason])

  const canSubmit = validationError === null

  const updateItem = (
    itemId: number,
    field: keyof Omit<EditableItemFormState, "id">,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    )
  }

  const handleSubmit = async () => {
    if (validationError || isModifyingEditableRequest) return

    await modifyEditablePurchaseRequest(requestId, {
      requester_email: requesterEmail,
      requested_by: requestedBy.trim() || null,
      needed_by_date: neededByDate || null,
      modification_reason: modificationReason.trim(),
      items: items.map((item) => ({
        id: item.id,
        description: item.description.trim(),
        reason: item.reason.trim() || null,
        quantity: parseNumber(item.quantity),
        quantity_format: item.quantity_format.trim() || null,
        requested_unit_price: parseNumber(item.requested_unit_price || "0"),
        requested_supplier: item.requested_supplier.trim() || null,
        product_link: item.product_link.trim() || null,
      })),
    })

    onDone()
  }

  if (isLoadingEditableRequestDetail) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 size={18} className="animate-spin" />
          Chargement de la demande...
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={17} />
        Retour aux demandes
      </button>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Modifier la demande #{requestReference}
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Vous pouvez modifier cette demande tant qu’aucun bon de commande n’a
          été créé.
        </p>
      </div>

      {editableRequestError && (
        <div className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{editableRequestError}</p>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Nom du demandeur
          </span>

          <input
            value={requestedBy}
            onChange={(event) => setRequestedBy(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Date requise
          </span>

          <input
            type="date"
            value={neededByDate}
            onChange={(event) => setNeededByDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
          />
        </label>
      </div>

      <div className="mt-7 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Articles</h3>

        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="mb-4 text-sm font-semibold text-slate-800">
              Article {index + 1}
            </p>

            <div className="grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>

                <input
                  value={item.description}
                  onChange={(event) =>
                    updateItem(item.id, "description", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Justification
                </span>

                <textarea
                  value={item.reason}
                  onChange={(event) =>
                    updateItem(item.id, "reason", event.target.value)
                  }
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Quantité
                  </span>

                  <input
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, "quantity", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Unité
                  </span>

                  <input
                    value={item.quantity_format}
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        "quantity_format",
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Prix unitaire estimé
                  </span>

                  <input
                    inputMode="decimal"
                    value={item.requested_unit_price}
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        "requested_unit_price",
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Fournisseur souhaité
                </span>

                <input
                  value={item.requested_supplier}
                  onChange={(event) =>
                    updateItem(
                      item.id,
                      "requested_supplier",
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Lien du produit
                </span>

                <input
                  value={item.product_link}
                  onChange={(event) =>
                    updateItem(item.id, "product_link", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-slate-700">
          Raison de la modification
        </span>

        <textarea
          value={modificationReason}
          onChange={(event) => setModificationReason(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
          placeholder="Ex. La quantité demandée a changé."
        />
      </label>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Retour
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isModifyingEditableRequest}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isModifyingEditableRequest ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={17} />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>

      {!canSubmit && !isModifyingEditableRequest && (
        <p className="mt-3 text-right text-sm font-medium text-amber-700">
          {validationError}
        </p>
      )}
    </div>
  )
}

export default ModifyEditableRequestPanel
