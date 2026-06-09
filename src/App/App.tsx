import { Outlet } from "react-router-dom"


const App = () => {
  return (
    <article className="min-h-screen w-full bg-tertiary font-tertiary">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <header className="px-4 pt-8 tablet:px-8">
          <h1 className="text-balance text-center text-3xl font-black text-secondary tablet:text-5xl">
            Formulaire de demande d'achat
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 tablet:text-base">
            Créez une demande claire avec les détails nécessaires pour l'achat,
            l'approbation et le suivi.
          </p>
        </header>
        <Outlet />
      </div>
    </article>
  )
}

export default App
