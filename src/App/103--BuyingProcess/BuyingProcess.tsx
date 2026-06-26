import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  useBuying,
  type CreatePurchaseOrderResponse,
  type PurchaseMode,
  type Supplier,
} from "../../Contexts/BuyingContext"
import type { PurchaseRequestItem } from "../../Contexts/PurchaseRequestContext"
import SuccesOverlay from "../SuccesOverlay"
import vegibecLogo from "../../assets/vegibec.png"
import {
  createEmptyGroup,
  createItemFormFromRequestItem,
  toRoundedMoney,
} from "./Utils/buyingHelpers"
import { buildCreatePurchaseOrderPayload } from "./Utils/buyingPayload"
import type {
  PurchaseOrderGroupForm,
  PurchaseOrderItemForm,
} from "./Utils/buyingTypes"

const PURCHASE_TRACKING_URL = "https://vegibec-portail.com/suivi-des-achats"
const SUCCESS_REDIRECT_DELAY_MS = 5000
const VEGIBEC_ADDRESS = [
  "Vegibec",
  "171 Rang Ste-Sophie",
  "OKA",
  "J0N 1E0 Québec, Canada",
  "4505960566",
].join("\n")

type CreatedPurchaseOrderJournalEntry = {
  id: number
  reference: string
  supplierName: string | null
  pdfUrl: string | null
}

type PurchaseOrderDocumentProps = {
  group: PurchaseOrderGroupForm
  groupIndex: number
  groupsCount: number
  suppliers: Supplier[]
  requestItems: PurchaseRequestItem[]
  selectedItemIdsInOtherGroups: Set<number>
  canRemove: boolean
  requestReference: string | number
  onChange: (group: PurchaseOrderGroupForm) => void
  onRemove: () => void
}

const getTodayDateInputValue = () => {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const getPurchaseOrderPdfUrl = (result: CreatePurchaseOrderResponse) =>
  result.purchase_order_pdf?.url ?? result.purchase_order_pdf_urls?.[0] ?? null

const toNumber = (value: string) => {
  const number = Number(value.trim().replace(",", "."))

  return Number.isFinite(number) ? number : 0
}

const formatMoney = (value: number) =>
  value.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const getSupplierAddress = (supplier: Supplier) =>
  [
    supplier.name,
    supplier.address_snapshot,
    supplier.city,
    supplier.province,
    supplier.postal_code,
    supplier.country,
  ]
    .filter(Boolean)
    .join("\n")

const PurchaseOrderDocument = ({
  group,
  groupIndex,
  groupsCount,
  suppliers,
  requestItems,
  selectedItemIdsInOtherGroups,
  canRemove,
  requestReference,
  onChange,
  onRemove,
}: PurchaseOrderDocumentProps) => {
  const selectedItemIds = useMemo(
    () => new Set(group.items.map((item) => item.purchase_request_item_id)),
    [group.items],
  )

  const totalAmount = useMemo(
    () =>
      group.items.reduce(
        (total, item) =>
          total +
          toRoundedMoney(
            toNumber(item.ordered_quantity) * toNumber(item.final_unit_price),
          ),
        0,
      ),
    [group.items],
  )

  const updateItem = (
    purchaseRequestItemId: number,
    updatedItem: PurchaseOrderItemForm,
  ) => {
    onChange({
      ...group,
      items: group.items.map((item) =>
        item.purchase_request_item_id === purchaseRequestItemId
          ? updatedItem
          : item,
      ),
    })
  }

  const toggleItem = (requestItem: PurchaseRequestItem) => {
    if (selectedItemIds.has(requestItem.id)) {
      onChange({
        ...group,
        items: group.items.filter(
          (item) => item.purchase_request_item_id !== requestItem.id,
        ),
      })
      return
    }

    onChange({
      ...group,
      items: [...group.items, createItemFormFromRequestItem(requestItem)],
    })
  }

  const selectSupplier = (supplierId: string) => {
    if (!supplierId) {
      onChange({
        ...group,
        supplier_id: null,
        supplier_name: "",
        supplier_address_snapshot: "",
        supplier_phone: "",
      })
      return
    }

    const supplier = suppliers.find(
      (currentSupplier) => String(currentSupplier.id) === supplierId,
    )

    if (!supplier) return

    onChange({
      ...group,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_address_snapshot: getSupplierAddress(supplier),
      supplier_phone: supplier.phone ?? supplier.supplier_phone ?? "",
    })
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <header className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div>
          <img
            src={vegibecLogo}
            alt="Vegibec"
            className="h-auto w-44 max-w-full"
          />
        </div>

        <div className="text-sm font-medium leading-6 text-slate-900 md:text-center">
          <p className="text-2xl font-black">Vegibec</p>
          <p>171 Rang Ste-Sophie</p>
          <p>OKA, Québec, Canada, J0N 1E0</p>
          <p>Téléphone (450) 596-0566</p>
          <p>entrepot@vegibec.com</p>
        </div>

        <div className="text-left md:text-right">
          <h1 className="text-3xl font-black text-slate-950">Bon d'achat</h1>
          <p className="mt-2 text-sm font-black uppercase text-slate-500">
            # Commande
          </p>
          <p className="text-lg font-bold text-slate-700 wrap-anywhere">
            {requestReference}
            {groupsCount > 1 ? `-${groupIndex + 1}` : ""}
          </p>
        </div>
      </header>

      <div className="mt-6 border-t-4 border-[#1f6b24]" />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          Bon {groupIndex + 1} de {groupsCount}
        </p>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Retirer ce bon
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <section className="rounded-xl border border-[#d2dfd2] p-4">
          <label className="block">
            <span className="text-lg font-black text-[#1f6b24]">
              Acheté de
            </span>
            <select
              value={group.supplier_id ?? ""}
              onChange={(event) => selectSupplier(event.target.value)}
              className="mt-4 w-full rounded-lg border border-[#d2dfd2] px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <input
            value={group.supplier_name}
            onChange={(event) =>
              onChange({ ...group, supplier_name: event.target.value })
            }
            placeholder="Nom du fournisseur"
            className="mt-3 w-full rounded-lg border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
          />

          <label className="mt-3 block">
            <span className="text-sm font-black uppercase text-[#1f6b24]">
              Adresse
            </span>
            <textarea
              value={group.supplier_address_snapshot}
              onChange={(event) =>
                onChange({
                  ...group,
                  supplier_address_snapshot: event.target.value,
                })
              }
              className="mt-2 min-h-28 w-full resize-none rounded-lg border border-transparent p-2 text-sm leading-6 text-slate-900 outline-none focus:border-[#4B7312]"
            />
          </label>

          <label className="mt-3 block border-t border-[#d2dfd2] pt-3">
            <span className="text-sm font-black uppercase text-[#1f6b24]">
              Téléphone
            </span>
            <input
              value={group.supplier_phone}
              onChange={(event) =>
                onChange({ ...group, supplier_phone: event.target.value })
              }
              placeholder="Numéro du fournisseur"
              className="mt-2 w-full rounded-lg border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
            />
          </label>
        </section>

        <section className="rounded-xl border border-[#d2dfd2] p-4">
          <h2 className="text-lg font-black text-[#1f6b24]">Expédié à</h2>
          <textarea
            value={group.shipping_address_snapshot || VEGIBEC_ADDRESS}
            onChange={(event) =>
              onChange({
                ...group,
                shipping_address_snapshot: event.target.value,
              })
            }
            className="mt-4 min-h-32 w-full resize-none rounded-lg border border-transparent p-2 text-sm leading-6 text-slate-900 outline-none focus:border-[#4B7312]"
          />

          <div className="mt-4 border-t border-[#d2dfd2] pt-4">
            <label className="block">
              <span className="text-lg font-black text-[#1f6b24]">
                Acheteur
              </span>
              <input
                value={group.buyer_name}
                onChange={(event) =>
                  onChange({ ...group, buyer_name: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-[#d2dfd2] p-4">
          <label className="block">
            <span className="text-lg font-black text-[#1f6b24]">
              Date commandé
            </span>
            <div className="mt-4 flex gap-2">
              <input
                type="date"
                value={group.ordered_at}
                onChange={(event) =>
                  onChange({ ...group, ordered_at: event.target.value })
                }
                className="min-w-0 flex-1 border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...group, ordered_at: getTodayDateInputValue() })
                }
                className="rounded-lg border border-[#4B7312] px-3 py-2 text-sm font-semibold text-[#4B7312] hover:bg-[#4B7312] hover:text-white"
              >
                Aujourd'hui
              </button>
            </div>
          </label>

          <label className="mt-8 block">
            <span className="text-lg font-black text-[#1f6b24]">
              Méthode de livraison
            </span>
            <input
              value={group.delivery_method}
              onChange={(event) =>
                onChange({ ...group, delivery_method: event.target.value })
              }
              className="mt-4 w-full border-0 border-b border-[#d2dfd2] px-0 py-2 text-sm outline-none focus:border-[#4B7312]"
            />
          </label>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-[#d2dfd2] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#1f6b24]">
            Articles à inclure
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            {group.items.length} article{group.items.length > 1 ? "s" : ""}{" "}
            sélectionné{group.items.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-3 grid gap-2">
          {requestItems.map((requestItem) => {
            const selectedInOtherGroup = selectedItemIdsInOtherGroups.has(
              requestItem.id,
            )
            const selected = selectedItemIds.has(requestItem.id)

            return (
              <label
                key={requestItem.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  selectedInOtherGroup
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                    : "cursor-pointer border-slate-200 hover:border-[#4B7312]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={selectedInOtherGroup}
                  onChange={() => toggleItem(requestItem)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 wrap-anywhere">
                    {requestItem.description}
                  </p>
                  <p className="text-sm text-slate-600">
                    Quantité demandée: {requestItem.quantity}{" "}
                    {requestItem.quantity_format ?? ""}
                  </p>
                  {selectedInOtherGroup && (
                    <p className="mt-1 text-xs font-semibold text-orange-700">
                      Déjà inclus dans un autre bon d'achat
                    </p>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-200 table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[41%]" />
            <col className="w-[12%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-100 text-center text-sm font-black text-slate-950">
              <th className="border border-[#d2dfd2] px-3 py-3">Code</th>
              <th className="border border-[#d2dfd2] px-3 py-3">
                Description
              </th>
              <th className="border border-[#d2dfd2] px-3 py-3">Quantité</th>
              <th className="border border-[#d2dfd2] px-3 py-3">Unité</th>
              <th className="border border-[#d2dfd2] px-3 py-3">Prix</th>
              <th className="border border-[#d2dfd2] px-3 py-3">Montant</th>
            </tr>
          </thead>

          <tbody>
            {group.items.map((item) => {
              const lineTotal =
                toRoundedMoney(
                  toNumber(item.ordered_quantity) * toNumber(item.final_unit_price),
                )

              return (
                <tr key={item.purchase_request_item_id} className="align-top">
                  <td className="border border-[#d2dfd2] p-2">
                    <input
                      value={item.item_code}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          item_code: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                    />
                  </td>

                  <td className="border border-[#d2dfd2] p-2">
                    <textarea
                      value={item.item_description}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          item_description: event.target.value,
                        })
                      }
                      className="min-h-16 w-full resize-none rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                    />
                  </td>

                  <td className="border border-[#d2dfd2] p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ordered_quantity}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          ordered_quantity: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                    />
                  </td>

                  <td className="border border-[#d2dfd2] p-2">
                    <input
                      value={item.ordered_unit}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          ordered_unit: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                    />
                  </td>

                  <td className="border border-[#d2dfd2] p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.final_unit_price}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          final_unit_price: event.target.value,
                        })
                      }
                      className="w-full rounded-md border border-transparent px-2 py-2 text-sm outline-none focus:border-[#4B7312]"
                    />
                  </td>

                  <td className="border border-[#d2dfd2] px-3 py-4 text-right text-sm font-semibold text-slate-900">
                    {formatMoney(lineTotal)}
                  </td>

                </tr>
              )
            })}

            {group.items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border border-[#d2dfd2] px-3 py-10 text-center text-sm font-semibold text-slate-500"
                >
                  Cochez au moins un article à inclure dans ce bon d'achat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
          Total: {formatMoney(totalAmount)} {group.currency_code || "CAD"}
        </p>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-black uppercase text-[#1f6b24]">
          Note d'achat
        </span>
        <textarea
          value={group.purchase_note}
          onChange={(event) =>
            onChange({ ...group, purchase_note: event.target.value })
          }
          className="mt-2 min-h-20 w-full rounded-lg border border-[#d2dfd2] px-3 py-2 text-sm"
        />
      </label>
    </section>
  )
}

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

    let cancelled = false

    fetchBuyingRequestByToken(Number(id), token).then((request) => {
      if (cancelled || !request) return

      setGroups([
        {
          ...createEmptyGroup(),
          shipping_address_snapshot: VEGIBEC_ADDRESS,
          buyer_name: request.buyer_name
            ? [request.buyer_name, request.buyer_surname]
                .filter(Boolean)
                .join(" ")
            : "",
          ordered_at: getTodayDateInputValue(),
          items: (request.items ?? []).map(createItemFormFromRequestItem),
        },
      ])
    })

    fetchSuppliers()

    return () => {
      cancelled = true
    }
  }, [id, token, fetchBuyingRequestByToken, fetchSuppliers])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const requestItems = useMemo(() => buyingRequest?.items ?? [], [buyingRequest])

  const activeGroups = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups],
  )

  const selectedRequestItemIds = useMemo(
    () =>
      new Set(
        groups.flatMap((group) =>
          group.items.map((item) => item.purchase_request_item_id),
        ),
      ),
    [groups],
  )

  const purchaseMode: PurchaseMode = useMemo(() => {
    if (requestItems.length === 0) return "partial"

    const allItemsSelected = requestItems.every((item) =>
      selectedRequestItemIds.has(item.id),
    )

    return allItemsSelected ? "full" : "partial"
  }, [requestItems, selectedRequestItemIds])

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        ...createEmptyGroup(),
        shipping_address_snapshot: VEGIBEC_ADDRESS,
        ordered_at: getTodayDateInputValue(),
      },
    ])
  }

  const removeGroup = (localId: string) => {
    setGroups((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((group) => group.localId !== localId),
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

    const invalidGroup = activeGroups.find((group) =>
      group.items.some(
        (item) =>
          toNumber(item.ordered_quantity) <= 0 ||
          (item.final_unit_price.trim() !== "" &&
            !Number.isFinite(Number(item.final_unit_price.replace(",", ".")))),
      ),
    )

    if (invalidGroup) {
      setSubmitError("Chaque article doit avoir une quantité et un prix valides.")
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
    return <main className="min-h-screen bg-tertiary p-6">Chargement...</main>
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
        <SuccesOverlay
          successMessage="Le ou les bons d'achat ont été créés avec succès."
          onClose={() => setSubmitSuccess(false)}
          name="Ricardo"
        />
      )}

      <div className="mx-auto max-w-5xl space-y-5">
        {createdPurchaseOrders.length > 0 && (
          <section className="rounded-xl border border-[#4B7312]/30 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#4B7312]">
                  Bons d'achat créés ({createdPurchaseOrders.length})
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Redirection vers le suivi des achats dans 5 secondes.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {createdPurchaseOrders.map((purchaseOrder, index) => (
                <div
                  key={purchaseOrder.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-slate-500">
                        Bon {index + 1}
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

        {groups.map((group, index) => {
          const selectedItemIdsInOtherGroups = new Set(
            groups
              .filter((currentGroup) => currentGroup.localId !== group.localId)
              .flatMap((currentGroup) =>
                currentGroup.items.map((item) => item.purchase_request_item_id),
              ),
          )

          return (
            <PurchaseOrderDocument
              key={group.localId}
              group={group}
              groupIndex={index}
              groupsCount={groups.length}
              suppliers={suppliers}
              requestItems={requestItems}
              selectedItemIdsInOtherGroups={selectedItemIdsInOtherGroups}
              canRemove={groups.length > 1}
              requestReference={buyingRequest.request_reference ?? buyingRequest.id}
              onChange={(updatedGroup) =>
                updateGroup(group.localId, updatedGroup)
              }
              onRemove={() => removeGroup(group.localId)}
            />
          )
        })}

        <button
          type="button"
          onClick={addGroup}
          className="rounded-xl border border-dashed border-[#4B7312] bg-white px-4 py-3 text-sm font-semibold text-[#4B7312] hover:bg-[#4B7312] hover:text-white"
        >
          + Ajouter un autre bon d'achat
        </button>

        <section className="sticky bottom-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          {submitError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#4B7312]">
                {purchaseMode === "full" ? "Achat complet" : "Achat partiel"}
              </p>
              <p className="text-sm text-slate-600">
                {selectedRequestItemIds.size} article
                {selectedRequestItemIds.size > 1 ? "s" : ""} sur{" "}
                {requestItems.length}
              </p>
            </div>

            <button
              type="button"
              disabled={activeGroups.length === 0 || loading}
              onClick={handleSubmit}
              className="cursor-pointer rounded-xl bg-[#4B7312] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer le ou les bons d'achat"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default BuyingProcess
