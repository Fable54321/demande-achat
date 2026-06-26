import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"
import { useReceiptVoucher } from "../../Contexts/ReceiptVoucherContext"
import SuccesOverlay from "../SuccesOverlay"

type ReceiptVoucherItemForm = {
  purchase_request_item_id: number
  description: string
  quantity: string
  quantity_format: string
  received_quantity: string
  comment: string
  selected: boolean
}

const getTodayDateInputValue = () => {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const toNullableText = (value: string) => {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

const createItemsFromRequest = (
  items: {
    id: number
    description: string
    quantity: number
    quantity_format: string | null
  }[],
): ReceiptVoucherItemForm[] =>
  items.map((item) => ({
    purchase_request_item_id: item.id,
    description: item.description ?? "",
    quantity: String(item.quantity ?? ""),
    quantity_format: item.quantity_format ?? "",
    received_quantity: String(item.quantity ?? ""),
    comment: "",
    selected: true,
  }))

const ReceiptVouchersCreation = () => {
  const { id, token } = useParams<{ id: string; token: string }>()
  const { employees } = usePurchaseRequests()
  const {
    receiptVoucherRequest,
    lastCreatedReceiptVoucher,
    fetchReceiptVoucherRequestByToken,
    createReceiptVoucher,
    loadingReceiptVoucher,
    receiptVoucherError,
    clearReceiptVoucherError,
  } = useReceiptVoucher()

  const [receivedByUserId, setReceivedByUserId] = useState("")
  const [receivedAt, setReceivedAt] = useState(getTodayDateInputValue())
  const [receiptNote, setReceiptNote] = useState("")
  const [items, setItems] = useState<ReceiptVoucherItemForm[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (!id || !token) return

    let cancelled = false

    fetchReceiptVoucherRequestByToken(Number(id), token).then((request) => {
      if (cancelled || !request) return

      setItems(createItemsFromRequest(request.items ?? []))
    })

    return () => {
      cancelled = true
    }
  }, [id, token, fetchReceiptVoucherRequestByToken])

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected),
    [items],
  )

  const updateItem = (
    purchaseRequestItemId: number,
    update: Partial<ReceiptVoucherItemForm>,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.purchase_request_item_id === purchaseRequestItemId
          ? { ...item, ...update }
          : item,
      ),
    )
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    clearReceiptVoucherError()

    if (!id || !token || !receiptVoucherRequest) {
      setSubmitError("Lien de reception invalide.")
      return
    }

    const receiverId = Number(receivedByUserId)

    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      setSubmitError("Selectionnez la personne qui a recu la marchandise.")
      return
    }

    if (selectedItems.length === 0) {
      setSubmitError("Selectionnez au moins un article recu.")
      return
    }

    const invalidItem = selectedItems.find((item) => {
      const quantity = Number(item.quantity)
      const receivedQuantity = Number(item.received_quantity)

      return (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(receivedQuantity) ||
        receivedQuantity <= 0
      )
    })

    if (invalidItem) {
      setSubmitError("Chaque article recu doit avoir une quantite valide.")
      return
    }

    const result = await createReceiptVoucher(Number(id), token, {
      purchase_request_id: receiptVoucherRequest.id,
      received_by_user_id: receiverId,
      received_at: receivedAt || null,
      receipt_note: toNullableText(receiptNote),
      items: selectedItems.map((item) => ({
        purchase_request_item_id: item.purchase_request_item_id,
        purchase_order_item_id: null,
        quantity: Number(item.quantity),
        received_quantity: Number(item.received_quantity),
        comment: toNullableText(item.comment),
      })),
    })

    if (!result) {
      setSubmitError("Erreur lors de la creation du bon de reception.")
      return
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    setSubmitSuccess(true)
  }

  if (loadingReceiptVoucher && !receiptVoucherRequest) {
    return <main className="min-h-screen bg-tertiary p-6">Chargement...</main>
  }

  if (receiptVoucherError && !receiptVoucherRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6 text-red-700">
        {receiptVoucherError}
      </main>
    )
  }

  if (!receiptVoucherRequest) {
    return (
      <main className="min-h-screen bg-tertiary p-6">
        Demande introuvable.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-tertiary px-4 py-6">
      {submitSuccess && (
        <SuccesOverlay
          successMessage="Le bon de reception a ete cree avec succes."
          onClose={() => setSubmitSuccess(false)}
          name="Ricardo"
        />
      )}

      <div className="mx-auto max-w-6xl space-y-6">
        {lastCreatedReceiptVoucher && (
          <section className="rounded-2xl border border-[#4B7312]/30 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase text-slate-500">
              Bon de reception cree
            </p>
            <p className="mt-1 text-xl font-bold text-[#4B7312] [overflow-wrap:anywhere]">
              {lastCreatedReceiptVoucher.receipt_voucher_reference}
            </p>
          </section>
        )}

        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#4B7312]">
            Bon de reception
          </p>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Demande #
                {receiptVoucherRequest.request_reference ??
                  receiptVoucherRequest.id}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Verifiez les articles recus et creez le bon de reception.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Resume de la demande
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">
                Demande par
              </p>
              <p className="mt-1 text-slate-900">
                {receiptVoucherRequest.requested_by}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">
                Date attendue
              </p>
              <p className="mt-1 text-slate-900">
                {receiptVoucherRequest.expected_date?.slice(0, 10) ??
                  "Non specifiee"}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">
                Articles selectionnes
              </p>
              <p className="mt-1 text-slate-900">
                {selectedItems.length} sur {items.length}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Articles recus
          </h2>

          <div className="mt-4 grid gap-2">
            {items.map((item) => (
              <label
                key={item.purchase_request_item_id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3"
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(event) =>
                    updateItem(item.purchase_request_item_id, {
                      selected: event.target.checked,
                    })
                  }
                  className="mt-1"
                />

                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-lg font-semibold text-slate-900 wrap-anywhere">
                    {item.description}
                  </p>
                  <p className="text-md text-slate-600 wrap-anywhere">
                    Quantite demandee: {item.quantity} {item.quantity_format}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-180 table-fixed text-left">
                <thead className="bg-slate-50 text-sm uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Quantite</th>
                    <th className="px-3 py-2">Quantite recue</th>
                    <th className="px-3 py-2">Commentaire</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedItems.map((item) => (
                    <tr
                      key={item.purchase_request_item_id}
                      className="border-t border-slate-200"
                    >
                      <td className="min-w-0 px-3 py-2">
                        <p className="whitespace-pre-wrap text-sm font-semibold text-slate-900 wrap-anywhere">
                          {item.description}
                        </p>
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.purchase_request_item_id, {
                              quantity: event.target.value,
                            })
                          }
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.received_quantity}
                          onChange={(event) =>
                            updateItem(item.purchase_request_item_id, {
                              received_quantity: event.target.value,
                            })
                          }
                          className="w-32 rounded-lg border border-slate-300 px-2 py-1"
                        />
                      </td>

                      <td className="min-w-0 px-3 py-2">
                        <input
                          value={item.comment}
                          onChange={(event) =>
                            updateItem(item.purchase_request_item_id, {
                              comment: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Informations de reception
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Recu par
              </span>
              <select
                value={receivedByUserId}
                onChange={(event) => setReceivedByUserId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="">Selectionner un employe</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {[employee.name, employee.surname].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Date recue
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                <input
                  type="date"
                  value={receivedAt}
                  onChange={(event) => setReceivedAt(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setReceivedAt(getTodayDateInputValue())}
                  className="rounded-lg border border-[#4B7312] px-3 py-2 text-sm font-semibold text-[#4B7312] hover:bg-[#4B7312] hover:text-white"
                >
                  Aujourd'hui
                </button>
              </div>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">
              Note de reception
            </span>
            <textarea
              value={receiptNote}
              onChange={(event) => setReceiptNote(event.target.value)}
              className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
        </section>

        <section className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          {(submitError || receiptVoucherError) && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {submitError || receiptVoucherError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Le bon de reception sera cree avec les articles selectionnes.
            </p>

            <button
              type="button"
              disabled={selectedItems.length === 0 || loadingReceiptVoucher}
              onClick={handleSubmit}
              className="cursor-pointer rounded-xl bg-[#4B7312] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingReceiptVoucher
                ? "Creation..."
                : "Creer le bon de reception"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ReceiptVouchersCreation
