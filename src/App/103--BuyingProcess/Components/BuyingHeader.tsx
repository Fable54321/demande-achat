import type { PurchaseRequest } from "../../../Contexts/PurchaseRequestContext"

type Props = {
  purchaseRequest: PurchaseRequest
}

const BuyingHeader = ({ purchaseRequest }: Props) => {
  return (
    <header className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#4B7312]">Bon de commande</p>

      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Demande #{purchaseRequest.request_reference ?? purchaseRequest.id}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Vérifiez les articles, choisissez le fournisseur et créez le bon
            d'achat.
          </p>
        </div>

        <span className="rounded-full bg-tertiary px-3 py-1 text-sm font-semibold text-[#4B7312]">
          {purchaseRequest.status}
        </span>
      </div>
    </header>
  )
}

export default BuyingHeader