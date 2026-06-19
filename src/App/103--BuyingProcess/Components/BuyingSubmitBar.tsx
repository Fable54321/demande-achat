type Props = {
  loading: boolean
  error: string | null
  disabled: boolean
  onSubmit: () => void
}

const BuyingSubmitBar = ({ loading, error, disabled, onSubmit }: Props) => {
  return (
    <section className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Les bons d'achat seront créés selon les groupes configurés.
        </p>

        <button
          type="button"
          disabled={disabled || loading}
          onClick={onSubmit}
          className="rounded-xl bg-[#4B7312] px-5 py-3 text-sm font-bold
           text-white disabled:cursor-not-allowed cursor-pointer disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer le ou les bons d'achat"}
        </button>
      </div>
    </section>
  )
}

export default BuyingSubmitBar