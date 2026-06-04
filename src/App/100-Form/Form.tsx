

const Form = () => {
  return (
    <section className="w-full flex flex-col items-center">
      <form action="" className="flex flex-col gap-4 mt-10  border border-secondary p-4 rounded-lg">
        <label htmlFor="name" className="flex gap-2">
          Nom:
        
            <input className="basic-input" type="text" id="name" name="name" />
        </label>
        <label className="w-full flex flex-col gap-1">
            Description du produit à acheter: 
            <textarea className="basic-input mx-auto" name="description" id="description" cols={30} rows={3}></textarea>
        </label>
        <label  className="w-full flex flex-col gap-1">
        Justification de l'achat:
        <textarea className="basic-input mx-auto" name="justification" id="justification" cols={30} rows={3}></textarea>
        </label>

        <label className="w-full flex flex-col gap-1">
            Prix connu ou estimé:
            <input className="basic-input" type="text" name="price" id="price" />
        </label>

        <label className="w-full flex flex-col gap-1">
            Lien vers le produit (si possible):
            <input className="basic-input" type="text" name="link" id="link" />
        </label>
        
      </form>
    </section>
  )
}

export default Form
