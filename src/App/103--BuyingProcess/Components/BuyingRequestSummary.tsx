import type { PurchaseRequest } from "../../../Contexts/PurchaseRequestContext"

type Props = {
  purchaseRequest: PurchaseRequest
}

const BuyingRequestSummary = ({ purchaseRequest }: Props) => {
  const itemCount = purchaseRequest.items?.length ?? 0

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        Résumé de la demande
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">
            Demandé par
          </p>
          <p className="mt-1  text-slate-900">
            {purchaseRequest.requested_by}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">
            Date attendue
          </p>
          <p className="mt-1  text-slate-900">
            {(purchaseRequest.expected_date)?.slice(0, 10) ?? "Non spécifiée"}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">
            Nombre d'articles
          </p>
          <p className="mt-1  text-slate-900">
            {itemCount} {itemCount > 1 ? "articles" : "article"}
          </p>
        </div>
      </div>

  
    </section>
  )
}

export default BuyingRequestSummary