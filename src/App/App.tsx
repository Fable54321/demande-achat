import { Outlet } from "react-router-dom"


const App = () => {
  return (
    <article className="bg-tertiary font-tertiary flex flex-col w-full items-center">
      <div className="mt-8 shadow-2xl bg-white p-4 rounded-2xl">
        <h1 className="font-tertiary font-bold text-secondary mt-4 text-[2.5em] ">Formulaire de demande d'achat</h1>
      <Outlet />
      </div>
    </article>
  )
}

export default App
