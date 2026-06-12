

const SuccesOverlay = () => {
  return (
      <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-email-title"
      onClick={onClose}
    >
     This is the success overlay
    </div>
  )
}

export default SuccesOverlay
