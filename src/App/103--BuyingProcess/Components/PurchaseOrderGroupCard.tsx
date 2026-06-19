import type {
  PurchaseMode,
  Supplier,
} from "../../../Contexts/BuyingContext"
import type { PurchaseRequestItem } from "../../../Contexts/PurchaseRequestContext"
import type { PurchaseOrderGroupForm } from "../Utils/buyingTypes"
import SupplierSelector from "./SupplierSelector"
import PurchaseOrderItemsPicker from "./PurchaseOrderItemsPicker"

type Props = {
  group: PurchaseOrderGroupForm
  groupIndex: number
  suppliers: Supplier[]
  requestItems: PurchaseRequestItem[]
  selectedItemIdsInOtherGroups: Set<number>
  purchaseMode: PurchaseMode
  canRemove: boolean
  onChange: (group: PurchaseOrderGroupForm) => void
  onRemove: () => void
}

const PurchaseOrderGroupCard = ({
  group,
  groupIndex,
  suppliers,
  requestItems,
  selectedItemIdsInOtherGroups,
  purchaseMode,
  canRemove,
  onChange,
  onRemove,
}: Props) => {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Articles à acheter</h2>
        <PurchaseOrderItemsPicker
          group={group}
          requestItems={requestItems}
          selectedItemIdsInOtherGroups={selectedItemIdsInOtherGroups}
          onChange={onChange}
        />
        </div>
      <div className="mb-5 mt-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bon d'achat {purchaseMode === "partial" ? groupIndex + 1 : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choisissez le fournisseur et les articles à inclure.
          </p>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Retirer
          </button>
        )}
      </div>

      <div className="space-y-6">
        <SupplierSelector
          group={group}
          suppliers={suppliers}
          onChange={onChange}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Date commandé
            </span>
            <input
              type="date"
              value={group.ordered_at}
              onChange={(event) =>
                onChange({ ...group, ordered_at: event.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Date reçue
            </span>
            <input
              type="date"
              value={group.received_at}
              onChange={(event) =>
                onChange({
                  ...group,
                  received_at: event.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              No facture
            </span>
            <input
              value={group.invoice_number}
              onChange={(event) =>
                onChange({ ...group, invoice_number: event.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Note d'achat
          </span>
          <textarea
            value={group.purchase_note}
            onChange={(event) =>
              onChange({ ...group, purchase_note: event.target.value })
            }
            className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>

      
      </div>
    </section>
  )
}

export default PurchaseOrderGroupCard
