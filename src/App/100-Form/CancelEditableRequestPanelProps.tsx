import { useEditablePurchaseRequests } from "../../Contexts/EditablePurchaseRequestContext"

type CancelEditableRequestPanelProps = {
  requestId: number
  requesterEmail: string
  onBack: () => void
  onDone: () => void
}

const CancelEditableRequestPanel = ({
  requestId,
  requesterEmail,
  onBack,
  onDone,
}: CancelEditableRequestPanelProps) => {
  const {
    cancelEditablePurchaseRequest,
    isCancellingEditableRequest,
    editableRequestError,
  } = useEditablePurchaseRequests()

  const [cancellationReason, setCancellationReason] = useState("")

  const canSubmit = cancellationReason.trim().length >= 3

  const handleSubmit = async () => {
    if (!canSubmit) return

    await cancelEditablePurchaseRequest(requestId, {
      requester_email: requesterEmail,
      cancellation_reason: cancellationReason.trim(),
    })

    onDone()
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Retour
      </button>

      <h2 className="text-xl font-semibold text-slate-900">
        Annuler la demande
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        Cette action annulera la demande. Elle ne pourra plus être modifiée par
        la suite.
      </p>

      <label className="mt-5 block text-sm font-medium text-slate-700">
        Raison de l’annulation
      </label>

      <textarea
        value={cancellationReason}
        onChange={(event) => setCancellationReason(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
        placeholder="Ex. La demande n’est plus nécessaire."
      />

      {editableRequestError && (
        <p className="mt-3 text-sm text-red-700">{editableRequestError}</p>
      )}

      <div className="mt-6 flex justify-end gap-3">
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
          disabled={!canSubmit || isCancellingEditableRequest}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCancellingEditableRequest
            ? "Annulation..."
            : "Confirmer l’annulation"}
        </button>
      </div>
    </div>
  )
}

export default CancelEditableRequestPanel