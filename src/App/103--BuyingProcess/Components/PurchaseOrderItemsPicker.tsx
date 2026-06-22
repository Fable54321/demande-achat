import type { PurchaseRequestItem } from "../../../Contexts/PurchaseRequestContext"
import {
  createItemFormFromRequestItem,
} from "../Utils/buyingHelpers"
import type {
  PurchaseOrderGroupForm,
  PurchaseOrderItemForm,
} from "../Utils/buyingTypes"

type Props = {
  group: PurchaseOrderGroupForm
  requestItems: PurchaseRequestItem[]
  selectedItemIdsInOtherGroups: Set<number>
  onChange: (group: PurchaseOrderGroupForm) => void
}

const PurchaseOrderItemsPicker = ({
  group,
  requestItems,
  selectedItemIdsInOtherGroups,
  onChange,
}: Props) => {
  const hasItem = (itemId: number) => {
    return group.items.some((item) => item.purchase_request_item_id === itemId)
  }

  const toggleItem = (requestItem: PurchaseRequestItem) => {
    if (hasItem(requestItem.id)) {
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

 

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
       {requestItems.map((requestItem) => {
  const isSelectedInOtherGroup = selectedItemIdsInOtherGroups.has(
    requestItem.id,
  )

  return (
    <label
      key={requestItem.id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
        isSelectedInOtherGroup
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : "border-slate-200"
      }`}
    >
      <input
        type="checkbox"
        checked={hasItem(requestItem.id)}
        disabled={isSelectedInOtherGroup}
        onChange={() => toggleItem(requestItem)}
        className="mt-1"
      />

      <div>
        <p className="font-semibold text-lg text-slate-900">
          {requestItem.description}
        </p>

        <p className="text-md text-slate-600">
          Quantité demandée: {requestItem.quantity}{" "}
          {requestItem.quantity_format ?? ""}
        </p>

        {isSelectedInOtherGroup && (
          <p className="mt-1 text-xs font-semibold text-orange-700">
            Déjà inclus dans un autre bon d'achat
          </p>
        )}
      </div>
    </label>
  )
})}
      </div>

      {group.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-200 text-left ">
            <thead className="bg-slate-50 text-sm uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Quantité</th>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2">Prix</th>
              </tr>
            </thead>

            <tbody>
              {group.items.map((item) => (
                <tr
                  key={item.purchase_request_item_id}
                  className="border-t border-slate-200"
                >
                  <td className="px-3 py-2">
                    <input
                      value={item.item_code}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          item_code: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      value={item.item_description}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          item_description: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={item.ordered_quantity}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          ordered_quantity: event.target.value,
                        })
                      }
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      value={item.ordered_unit}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          ordered_unit: event.target.value,
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
                      value={item.final_unit_price}
                      onChange={(event) =>
                        updateItem(item.purchase_request_item_id, {
                          ...item,
                          final_unit_price: event.target.value,
                        })
                      }
                      className="w-28 rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrderItemsPicker
