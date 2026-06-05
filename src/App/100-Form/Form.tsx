import { Calendar, DollarSign, Link2, PackageCheck, SquareDashedText, User } from "lucide-react"
import { useState } from "react"




const Form = () => {

const [name, setName] = useState("")
const [description, setDescription] = useState("")
const [justification, setJustification] = useState("")
const [price, setPrice] = useState("")
const [link, setLink] = useState("")
const [expectedDate, setExpectedDate] = useState("")


  return (
    <section className="w-full flex flex-col items-center pb-10">
      <form action="" className="bg-tertiary shadow-lg flex flex-col w-[min(90%,32rem)] gap-5 mt-6  border border-secondary p-6 rounded-xl">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-2">
          <User className=" text-white" size={28} />
          </div>
        <label htmlFor="name" className="flex flex-col gap-1">
          Nom:
        
            
        </label>
        </div>
        <input className="basic-input bg-white" 
        type="text" 
        id="name" 
        name="name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} />
        
        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center ">
          <SquareDashedText className=" text-white " size={28} />
          </div>
        <label className=" flex flex-col gap-1">
            Description du produit à acheter: 
            
        </label>
        </div>
        <textarea className="basic-input mx-auto w-full bg-white"
         name="description"
          id="description" 
          cols={30} 
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}></textarea>
        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <PackageCheck className=" text-white " size={28} />
          </div>
        <label  className=" flex flex-col gap-1">
        Justification de l'achat:
        
        </label>
        </div>
        <textarea className="basic-input mx-auto w-full bg-white" 
        name="justification" 
        id="justification" 
         rows={3}
         value ={justification}
         onChange={(e) => setJustification(e.target.value)}
         ></textarea>
        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <DollarSign className=" text-white " size={28} />
          </div>
        <label className=" flex flex-col gap-1">
            Prix connu ou estimé:
           
        </label>
        </div>
         <input className="basic-input bg-white" 
         type="text" 
         name="price" 
         id="price"
         value={price}
         onChange={(e) => setPrice(e.target.value)} />
        <div className="flex items-center flex-1 gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Link2 className=" text-white " size={28} />
          </div>
        <label className=" flex flex-col gap-1">
            Lien vers le produit (si possible):
            
        </label>
        </div>
        <input className="basic-input bg-white" type="text" name="link" id="link" />
        <div className="flex flex-col gap-2">

        <label className=" flex gap-2 items-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className=" text-white " size={28} />
            </div>
            <span>Sélectionner la date à laquelle le produit est attendu:</span>
            
        </label>
        <input className="basic-input mx-auto bg-white" 
        type="date" 
        name="expectedDate" 
        id="expectedDate"
        value={expectedDate}
        onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
        
      </form>
    </section>
  )
}

export default Form
