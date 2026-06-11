import { useState } from "react"
import { Mail, Send, X } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL
const subject = "Concernant votre demande d'achat"

type EmailOverlayProps = {
  isOpen: boolean
  onClose: () => void
  emailSendTo: string | null
 
}

const SendEmailOverlay = ({
  isOpen,
  onClose,
  emailSendTo,
  
}: EmailOverlayProps) => {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendEmail = async () => {
    if (!emailSendTo || !message.trim() || isSending) return

    try {
      setIsSending(true)
      setError(null)

      const response = await fetch(`${API_URL}/purchase-request/send-email`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailSendTo,
          subject,
          message: message.trim(),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || "Erreur lors de l'envoi du courriel")
      }

      setMessage("")
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi du courriel"

      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-email-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-secondary/15 bg-white shadow-2xl shadow-slate-950/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-secondary/15 bg-[#eef4e8] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
              <Mail size={22} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                Message au demandeur
              </p>
              <h2
                id="send-email-title"
                className="mt-1 text-xl font-black text-slate-950"
              >
              Envoyer un courriel à
              </h2>
              <p className="mt-1 truncate text-sm text-slate-600">
                {emailSendTo ?? "Aucun courriel disponible"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-secondary/15 bg-white text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-primary/25"
            aria-label="Fermer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <label
            htmlFor="requester-message"
            className="flex flex-col gap-2 text-sm font-bold text-slate-700"
          >
            Message &agrave; transmettre
            <textarea
              id="requester-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setError(null)
              }}
              rows={7}
              placeholder="Expliquez les informations manquantes ou les précisions demandées."
              className="min-h-40 resize-y rounded-lg border border-secondary/20 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-800 shadow-sm outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-secondary focus:ring-4 focus:ring-primary/20"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-secondary/10 bg-slate-50 px-5 py-4 tablet:flex-row tablet:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-secondary/20 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-primary/10 focus:outline-none focus:ring-4 focus:ring-primary/25"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSendEmail}
            disabled={!emailSendTo || !message.trim() || isSending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-black text-white shadow-lg shadow-secondary/20 transition hover:bg-[#3f610f] focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Send size={17} aria-hidden="true" />
            {isSending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SendEmailOverlay
