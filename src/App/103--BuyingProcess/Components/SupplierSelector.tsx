import { useMemo, useRef, useState } from "react"
import type { Supplier } from "../../../Contexts/BuyingContext"
import type { PurchaseOrderGroupForm } from "../Utils/buyingTypes"

type Props = {
  group: PurchaseOrderGroupForm
  suppliers: Supplier[]
  onChange: (group: PurchaseOrderGroupForm) => void
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

const SupplierSelector = ({ group, suppliers, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const supplierSearch = group.supplier_name

  const filteredSuppliers = useMemo(() => {
    const search = normalize(supplierSearch.trim())

    if (!search) return suppliers.slice(0, 8)

    return suppliers
      .filter((supplier) => normalize(supplier.name).includes(search))
      .slice(0, 8)
  }, [supplierSearch, suppliers])

  const selectedSupplier = useMemo(() => {
    if (!group.supplier_id) return null

    return suppliers.find((supplier) => supplier.id === group.supplier_id) ?? null
  }, [group.supplier_id, suppliers])

  const handleManualSupplierChange = (value: string) => {
    onChange({
      ...group,
      supplier_id: null,
      supplier_name: value,
    })

    setIsOpen(true)
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    onChange({
      ...group,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_address_snapshot: supplier.address_snapshot ?? "",
      supplier_phone: supplier.phone ?? "",
    })

    setIsOpen(false)
  }

  const clearSelectedSupplier = () => {
    onChange({
      ...group,
      supplier_id: null,
      supplier_name: "",
      supplier_address_snapshot: "",
      supplier_phone: "",
    })

    setIsOpen(false)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div ref={wrapperRef} className="relative md:col-span-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Fournisseur
          </span>

          <div className="relative mt-1">
            <input
              value={group.supplier_name}
              onChange={(event) =>
                handleManualSupplierChange(event.target.value)
              }
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setIsOpen(false), 120)
              }}
              placeholder="Rechercher ou entrer un fournisseur manuellement"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-24"
            />

            {group.supplier_name && (
              <button
                type="button"
                onClick={clearSelectedSupplier}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-red-700"
              >
                Effacer
              </button>
            )}
          </div>
        </label>

        {selectedSupplier && (
          <p className="mt-1 text-xs font-medium text-[#4B7312]">
            Fournisseur sélectionné depuis la liste
          </p>
        )}

        {!selectedSupplier && group.supplier_name.trim() && (
          <p className="mt-1 text-xs font-medium text-slate-500">
            Fournisseur saisi manuellement
          </p>
        )}

        {isOpen && filteredSuppliers.length > 0 && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleSupplierSelect(supplier)
                }}
                className="block w-full px-4 py-3 text-left hover:bg-tertiary"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {supplier.name}
                </p>

                {(supplier.address_snapshot || supplier.phone) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {[supplier.address_snapshot, supplier.phone]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="block md:col-span-2">
        <span className="text-sm font-semibold text-slate-700">
          Adresse du fournisseur
        </span>
        <textarea
          value={group.supplier_address_snapshot}
          onChange={(event) =>
            onChange({
              ...group,
              supplier_address_snapshot: event.target.value,
            })
          }
          className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Téléphone
        </span>
        <input
          value={group.supplier_phone}
          onChange={(event) =>
            onChange({ ...group, supplier_phone: event.target.value })
          }
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Référence fournisseur
        </span>
        <input
          value={group.supplier_reference}
          onChange={(event) =>
            onChange({ ...group, supplier_reference: event.target.value })
          }
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>
    </div>
  )
}

export default SupplierSelector