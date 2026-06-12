import { Check } from "lucide-react"


type SuccesOverlayProps = {
  onClose: () => void
  successMessage: string
  name: string
}


const SuccesOverlay = (  { onClose, successMessage, name }: SuccesOverlayProps) => {
  return (
      <div
      className="bg-white/95
        overlay-animation
       border-black/50 
       border-3 px-4 py-8 flex flex-col items-center w-[min(98%,350px)] rounded-xl absolute top-[40vh] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-email-title"
      onClick={onClose}
    >

      


      <p className="text-4xl font-bold text-center">Merci, {name && name}</p>

<div className="flex justify-center items-center bg-secondary w-20 h-20 rounded-full my-6">
      <Check  className="text-white" size={50} strokeWidth={4}/>
      </div>

      <p className="text-center text-xl">
        {successMessage}
        </p>
    </div>
  )
}

export default SuccesOverlay
