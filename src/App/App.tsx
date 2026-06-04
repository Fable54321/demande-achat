import { Outlet } from "react-router-dom"


const App = () => {
  return (
    <article className="bg-tertiary font-tertiary flex flex-col w-full items-center">
      <h1 className="font-primary font-bold text-secondary mt-10 text-[3em] ">Formulaire de demande d'achat</h1>
      <Outlet />
    </article>
  )
}

export default App
