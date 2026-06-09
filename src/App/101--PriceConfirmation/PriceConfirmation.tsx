import { useParams } from "react-router-dom"
import { usePurchaseRequests } from "../../Contexts/PurchaseRequestContext"


const PriceConfirmation = () => {

const { fetchPurchaseRequestById, validateBuyerPrice } = usePurchaseRequests()

const { id } = useParams();



  return (
    <article >
      
    </article>
  )
}

export default PriceConfirmation
