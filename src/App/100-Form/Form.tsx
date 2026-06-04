

const Form = () => {
  return (
    <section className="w-full flex flex-col items-center">
      <form action="" className=" flex flex-col w-[min(90%,30rem)] gap-4 mt-6  border border-secondary p-4 rounded-lg">
        <div>
        <label htmlFor="name" className="flex flex-col gap-1">
          Nom:
        
            <input className="basic-input bg-white" type="text" id="name" name="name" />
        </label>
        </div>
        <div>
        <label className="w-full flex flex-col gap-1">
            Description du produit à acheter: 
            <textarea className="basic-input mx-auto w-full bg-white" name="description" id="description" cols={30} rows={3}></textarea>
        </label>
        </div>
        <div>
        <label  className="w-full flex flex-col gap-1">
        Justification de l'achat:
        <textarea className="basic-input mx-auto w-full bg-white" name="justification" id="justification"  rows={3}></textarea>
        </label>
        </div>
        <div>
        <label className="w-full flex flex-col gap-1">
            Prix connu ou estimé:
            <input className="basic-input bg-white" type="text" name="price" id="price" />
        </label>
        </div>
        <div>
        <label className="w-full flex flex-col gap-1">
            Lien vers le produit (si possible):
            <input className="basic-input bg-white" type="text" name="link" id="link" />
        </label>
        </div>
        <div>
        <label>
            Sélectionner la date à laquelle le produit est attendu:
            <input className="basic-input bg-white" type="date" name="expectedDate" id="expectedDate" />
        </label>
        </div>
        
      </form>
    </section>
  )
}

export default Form
