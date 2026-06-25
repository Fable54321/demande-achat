import { AlertCircle, Loader2, Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useEditablePurchaseRequests } from "../../Contexts/EditablePurchaseRequestContext"
import CancelEditableRequestPanel from "./CancelEditableRequestPanel"
import ModifyEditableRequestPanel from "./ModifyEditableRequestPanel"

type Employee = {
  name: string
  surname?: string | null
  email?: string | null
}

type EditableRequestsOverlayProps = {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
}

type OverlayMode = "lookup" | "modify" | "cancel"

const formatEmployeeName = (employee: Employee) => {
  return [employee.surname, employee.name].filter(Boolean).join(" ")
}

const EditableRequestsOverlay = ({
  isOpen,
  onClose,
  employees,
}: EditableRequestsOverlayProps) => {
  const {
    editableRequests,
    isLoadingEditableRequests,
    editableRequestError,
    fetchEditableRequestsByEmail,
    clearEditableRequestMessages,
  } = useEditablePurchaseRequests()

  const [mode, setMode] = useState<OverlayMode>("lookup")
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null,
  )
  const [selectedRequestEmail, setSelectedRequestEmail] = useState("")
  const [selectedEmail, setSelectedEmail] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const employeesWithEmail = useMemo(
    () =>
      employees
        .filter((employee) => employee.email)
        .sort((a, b) =>
          formatEmployeeName(a).localeCompare(formatEmployeeName(b), "fr"),
        ),
    [employees],
  )

  if (!isOpen) return null

  const resetOverlayState = () => {
    clearEditableRequestMessages()
    setMode("lookup")
    setSelectedRequestId(null)
    setSelectedRequestEmail("")
    setSelectedEmail("")
    setHasSearched(false)
  }

  const handleClose = () => {
    resetOverlayState()
    onClose()
  }

  const handleSearch = async () => {
    if (!selectedEmail) return

    setHasSearched(true)
    await fetchEditableRequestsByEmail(selectedEmail)
  }

  const handleOpenModify = (requestId: number) => {
    setSelectedRequestId(requestId)
    setSelectedRequestEmail(selectedEmail)
    setMode("modify")
  }

  const handleOpenCancel = (requestId: number) => {
    setSelectedRequestId(requestId)
    setSelectedRequestEmail(selectedEmail)
    setMode("cancel")
  }

  const handleBackToLookup = () => {
    clearEditableRequestMessages()
    setMode("lookup")
    setSelectedRequestId(null)
  }

  const handleActionDone = async () => {
    setMode("lookup")
    setSelectedRequestId(null)

    if (selectedRequestEmail) {
      setSelectedEmail(selectedRequestEmail)
      setHasSearched(true)
      await fetchEditableRequestsByEmail(selectedRequestEmail)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "lookup" && "Annuler ou modifier une demande"}
              {mode === "modify" && "Modifier une demande"}
              {mode === "cancel" && "Annuler une demande"}
            </h2>

            {mode === "lookup" && (
              <p className="mt-1 text-sm text-slate-600">
                Sélectionnez votre adresse courriel pour voir les demandes qui
                peuvent encore être modifiées ou annulées.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {mode === "lookup" && (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={selectedEmail}
                onChange={(event) => {
                  setSelectedEmail(event.target.value)
                  setHasSearched(false)
                  clearEditableRequestMessages()
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-100"
              >
                <option value="">Choisir une adresse courriel</option>

                {employeesWithEmail.map((employee) => (
                  <option key={employee.email} value={employee.email ?? ""}>
                    {formatEmployeeName(employee)} — {employee.email}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSearch}
                disabled={!selectedEmail || isLoadingEditableRequests}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingEditableRequests ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}

                Rechercher
              </button>
            </div>

            {editableRequestError && (
              <div className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{editableRequestError}</p>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {hasSearched &&
                editableRequests.length === 0 &&
                selectedEmail &&
                !isLoadingEditableRequests && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    Aucune demande modifiable ou annulable n’a été trouvée pour
                    cette adresse.
                  </div>
                )}

              {hasSearched &&
                editableRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Demande #{request.request_reference}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {request.description || "Aucune description"}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Statut : {request.status_label}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModify(request.id)}
                          className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCancel(request.id)}
                          className="cursor-pointer rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {mode === "modify" && selectedRequestId && (
          <ModifyEditableRequestPanel
            requestId={selectedRequestId}
            requesterEmail={selectedRequestEmail}
            onBack={handleBackToLookup}
            onDone={handleActionDone}
          />
        )}

        {mode === "cancel" && selectedRequestId && (
          <CancelEditableRequestPanel
            requestId={selectedRequestId}
            requesterEmail={selectedRequestEmail}
            onBack={handleBackToLookup}
            onDone={handleActionDone}
          />
        )}
      </div>
    </div>
  )
}

export default EditableRequestsOverlay