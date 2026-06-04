

const Form = () => {
  return (
    <section className="w-full flex flex-col items-center">
      <form action="" className="flex flex-col gap-4 mt-10  border border-secondary p-4">
        <label htmlFor="name" className="flex gap-2">
          Nom:
        
            <input className="basic-input" type="text" id="name" name="name" />
        </label>
        <label className="w-full flex flex-col">
            Description du produit à acheter: 
            <textarea className="basic-input mx-auto" name="description" id="description" cols={30} rows={5}></textarea>
        </label>
        
      </form>
    </section>
  )
}

export default Form
