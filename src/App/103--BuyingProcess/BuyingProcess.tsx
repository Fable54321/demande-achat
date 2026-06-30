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
  buildSupplierAddressSnapshot,
  createEmptyGroup,
  createItemFormFromRequestItem,
  DEFAULT_SUPPLIER_COUNTRY,
  DEFAULT_SUPPLIER_PROVINCE,
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

const toPositiveNumberOrNull = (value: string) => {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  const number = Number(trimmedValue.replace(",", "."))

  return Number.isFinite(number) && number > 0 ? number : null
}

const formatMoney = (value: number) =>
  value.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const purchaseOrderFieldClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4B7312] focus:ring-4 focus:ring-[#96c61c]/20"

const purchaseOrderTableFieldClass =
  "rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4B7312] focus:ring-4 focus:ring-[#96c61c]/20"

const deliveryMethodOptions = ["Ramassé", "Livré"] as const

const getSupplierAddressFields = (supplier: Supplier) => {
  return {
    supplier_address_street: supplier.address_snapshot || "",
    supplier_city: supplier.city || "",
    supplier_postal_code: supplier.postal_code || "",
    supplier_province: supplier.province || DEFAULT_SUPPLIER_PROVINCE,
    supplier_country: supplier.country || DEFAULT_SUPPLIER_COUNTRY,
  }
}

const buildGroupSupplierAddressSnapshot = (
  group: Pick<
    PurchaseOrderGroupForm,
    | "supplier_name"
    | "supplier_address_street"
    | "supplier_city"
    | "supplier_postal_code"
    | "supplier_province"
    | "supplier_country"
  >,
) =>
  buildSupplierAddressSnapshot({
    name: group.supplier_name,
    street: group.supplier_address_street,
    city: group.supplier_city,
    postalCode: group.supplier_postal_code,
    province: group.supplier_province,
    country: group.supplier_country,
  })

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

  const updateSupplierAddress = (
    update: Partial<
      Pick<
        PurchaseOrderGroupForm,
        | "supplier_name"
        | "supplier_address_street"
        | "supplier_city"
        | "supplier_postal_code"
        | "supplier_province"
        | "supplier_country"
      >
    >,
  ) => {
    const nextGroup = {
      ...group,
      ...update,
    }

    onChange({
      ...nextGroup,
      supplier_address_snapshot: buildGroupSupplierAddressSnapshot(nextGroup),
    })
  }

  const selectSupplier = (supplierId: string) => {
    if (!supplierId) {
      onChange({
        ...group,
        supplier_id: null,
        supplier_name: "",
        supplier_address_snapshot: "",
        supplier_address_street: "",
        supplier_city: "",
        supplier_postal_code: "",
        supplier_province: DEFAULT_SUPPLIER_PROVINCE,
        supplier_country: DEFAULT_SUPPLIER_COUNTRY,
        supplier_phone: "",
      })
      return
    }

    const supplier = suppliers.find(
      (currentSupplier) => String(currentSupplier.id) === supplierId,
    )

    if (!supplier) return
    const supplierAddressFields = getSupplierAddressFields(supplier)

    onChange({
      ...group,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      ...supplierAddressFields,
      supplier_address_snapshot: buildSupplierAddressSnapshot({
        name: supplier.name,
        street: supplierAddressFields.supplier_address_street,
        city: supplierAddressFields.supplier_city,
        postalCode: supplierAddressFields.supplier_postal_code,
        province: supplierAddressFields.supplier_province,
        country: supplierAddressFields.supplier_country,
      }),
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
              className={`mt-4 w-full ${purchaseOrderFieldClass}`}
            >
              <option value="">Fournisseurs enregistrés</option>
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
              updateSupplierAddress({ supplier_name: event.target.value })
            }
            placeholder="Nom du fournisseur"
            className={`mt-3 w-full ${purchaseOrderFieldClass}`}
          />

          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                No et rue
              </span>
              <input
                value={group.supplier_address_street}
                onChange={(event) =>
                  updateSupplierAddress({
                    supplier_address_street: event.target.value,
                  })
                }
                className={`mt-2 w-full ${purchaseOrderFieldClass}`}
              />
            </label>

            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                Ville
              </span>
              <input
                value={group.supplier_city}
                onChange={(event) =>
                  updateSupplierAddress({ supplier_city: event.target.value })
                }
                className={`mt-2 w-full ${purchaseOrderFieldClass}`}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Code postal
                </span>
                <input
                  value={group.supplier_postal_code}
                  onChange={(event) =>
                    updateSupplierAddress({
                      supplier_postal_code: event.target.value,
                    })
                  }
                  className={`mt-2 w-full ${purchaseOrderFieldClass}`}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Province
                </span>
                <input
                  value={group.supplier_province}
                  onChange={(event) =>
                    updateSupplierAddress({
                      supplier_province: event.target.value,
                    })
                  }
                  className={`mt-2 w-full ${purchaseOrderFieldClass}`}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black uppercase text-[#1f6b24]">
                Pays
              </span>
              <input
                value={group.supplier_country}
                onChange={(event) =>
                  updateSupplierAddress({
                    supplier_country: event.target.value,
                  })
                }
                className={`mt-2 w-full ${purchaseOrderFieldClass}`}
              />
            </label>
          </div>

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
              className={`mt-2 w-full ${purchaseOrderFieldClass}`}
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
            className={`mt-4 min-h-32 w-full resize-none leading-6 ${purchaseOrderFieldClass}`}
          />

          <div className="mt-4 border-t border-[#d2dfd2] pt-4">
            <h3 className="text-lg font-black text-[#1f6b24]">Acheteur</h3>

            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Nom
                </span>
                <input
                  value={group.buyer_name}
                  onChange={(event) =>
                    onChange({ ...group, buyer_name: event.target.value })
                  }
                  className={`mt-2 w-full ${purchaseOrderFieldClass}`}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black uppercase text-[#1f6b24]">
                  Courriel
                </span>
                <input
                  type="email"
                  value={group.buyer_email}
                  onChange={(event) =>
                    onChange({ ...group, buyer_email: event.target.value })
                  }
                  className={`mt-2 w-full ${purchaseOrderFieldClass}`}
                />
              </label>
            </div>
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
                className={`min-w-0 flex-1 ${purchaseOrderFieldClass}`}
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              {deliveryMethodOptions.map((deliveryMethod) => {
                const isSelected = group.delivery_method === deliveryMethod

                return (
                  <button
                    key={deliveryMethod}
                    type="button"
                    onClick={() =>
                      onChange({ ...group, delivery_method: deliveryMethod })
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      isSelected
                        ? "border-[#4B7312] bg-[#4B7312] text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-[#4B7312] hover:bg-tertiary"
                    }`}
                  >
                    {deliveryMethod}
                  </button>
                )
              })}
            </div>
            <input
              value={group.delivery_method}
              onChange={(event) =>
                onChange({ ...group, delivery_method: event.target.value })
              }
              className={`mt-4 w-full ${purchaseOrderFieldClass}`}
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
              <th className="border border-[#d2dfd2] px-3 py-3">
                Quantité *
              </th>
              <th className="border border-[#d2dfd2] px-3 py-3">Format</th>
              <th className="border border-[#d2dfd2] px-3 py-3">Prix *</th>
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
                      className={`w-full ${purchaseOrderTableFieldClass}`}
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
                      className={`min-h-16 w-full resize-none ${purchaseOrderTableFieldClass}`}
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
                      className={`w-full ${purchaseOrderTableFieldClass}`}
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
                      className={`w-full ${purchaseOrderTableFieldClass}`}
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
                      className={`w-full ${purchaseOrderTableFieldClass}`}
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
          className={`mt-2 min-h-20 w-full ${purchaseOrderFieldClass}`}
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
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(
    () => new Set(),
  )
  const [createdPurchaseOrders, setCreatedPurchaseOrders] = useState<
    CreatedPurchaseOrderJournalEntry[]
  >([])
  const warningsRef = useRef<HTMLElement | null>(null)
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

  const purchaseOrderWarnings = useMemo(() => {
    const warnings: { id: string; message: string }[] = []

    activeGroups.forEach((group, groupIndex) => {
      const groupLabel =
        activeGroups.length > 1 ? `Bon ${groupIndex + 1}` : "Bon d'achat"

      if (!group.supplier_name.trim()) {
        warnings.push({
          id: `${group.localId}:supplier-name`,
          message: `${groupLabel}: aucun fournisseur n'est indiqué.`,
        })
      }

      if (!group.supplier_address_snapshot.trim()) {
        warnings.push({
          id: `${group.localId}:supplier-address`,
          message: `${groupLabel}: l'adresse du fournisseur est vide.`,
        })
      }

      if (!group.supplier_phone.trim()) {
        warnings.push({
          id: `${group.localId}:supplier-phone`,
          message: `${groupLabel}: le téléphone du fournisseur est vide.`,
        })
      }

      if (!group.ordered_at) {
        warnings.push({
          id: `${group.localId}:ordered-at`,
          message: `${groupLabel}: la date de commande est vide.`,
        })
      }

      if (!group.delivery_method.trim()) {
        warnings.push({
          id: `${group.localId}:delivery-method`,
          message: `${groupLabel}: la méthode de livraison est vide.`,
        })
      }

      group.items.forEach((item, itemIndex) => {
        const itemLabel = `${groupLabel}, article ${itemIndex + 1}`

        if (!item.item_code.trim()) {
          warnings.push({
            id: `${group.localId}:${item.purchase_request_item_id}:code`,
            message: `${itemLabel}: aucun code d'article n'est indiqué.`,
          })
        }

        if (!item.item_description.trim()) {
          warnings.push({
            id: `${group.localId}:${item.purchase_request_item_id}:description`,
            message: `${itemLabel}: la description est vide.`,
          })
        }

      })
    })

    return warnings.filter((warning) => !dismissedWarnings.has(warning.id))
  }, [activeGroups, dismissedWarnings])

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
          toPositiveNumberOrNull(item.ordered_quantity) === null ||
          toPositiveNumberOrNull(item.final_unit_price) === null,
      ),
    )

    if (invalidGroup) {
      setSubmitError("Chaque article doit avoir une quantité et un prix valides.")
      return
    }

    if (purchaseOrderWarnings.length > 0) {
      setSubmitError(
        "Veuillez vérifier ou masquer les avertissements avant de créer le bon d'achat.",
      )
      warningsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
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

        {purchaseOrderWarnings.length > 0 && (
          <section
            ref={warningsRef}
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">Informations à vérifier</p>
                <p className="mt-1 text-amber-900">
                  Verifiez ces points, puis masquez-les pour confirmer que le
                  bon d'achat peut être créé.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDismissedWarnings(
                    new Set(purchaseOrderWarnings.map((warning) => warning.id)),
                  )
                }
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
              >
                Tout masquer
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {purchaseOrderWarnings.map((warning) => (
                <div
                  key={warning.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
                >
                  <span>{warning.message}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDismissedWarnings((prev) => {
                        const next = new Set(prev)
                        next.add(warning.id)
                        return next
                      })
                    }
                    className="shrink-0 text-xs font-bold text-amber-800 hover:text-amber-950"
                  >
                    Masquer
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
