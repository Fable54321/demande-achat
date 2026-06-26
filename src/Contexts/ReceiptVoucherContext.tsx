import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"


const API_URL = import.meta.env.VITE_API_URL

export type CreateReceiptVoucherItemPayload = {
  purchase_request_item_id: number
  purchase_order_item_id?: number | null
  quantity: number
  received_quantity: number
  comment?: string | null
}

export type CreateReceiptVoucherPayload = {
  purchase_request_id: number
  received_by_user_id: number
  received_at?: string | null
  receipt_note?: string | null
  items: CreateReceiptVoucherItemPayload[]
}

export type ReceiptVoucher = {
  id: number
  purchase_request_id: number
  receipt_voucher_reference: string
  receipt_voucher_sequence: number
  received_by_user_id: number | null
  received_at: string
  receipt_note: string | null
  receipt_document_keys: string[]
  status: string
  created_at: string
  updated_at: string
}

export type ReceiptVoucherItem = {
  id: number
  receipt_voucher_id: number
  purchase_request_item_id: number
  purchase_order_item_id: number | null
  quantity: number | string
  received_quantity: number | string | null
  comment: string | null
  created_at: string
  updated_at: string
}

type CreateReceiptVoucherResponse = {
  receipt_voucher: ReceiptVoucher
  items: ReceiptVoucherItem[]
}

type ReceiptVoucherContextValue = {
  createReceiptVoucher: (
    payload: CreateReceiptVoucherPayload,
  ) => Promise<CreateReceiptVoucherResponse | null>
  loadingReceiptVoucher: boolean
  receiptVoucherError: string | null
  clearReceiptVoucherError: () => void
}

const ReceiptVoucherContext = createContext<ReceiptVoucherContextValue | null>(
  null,
)

export const ReceiptVoucherProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [loadingReceiptVoucher, setLoadingReceiptVoucher] = useState(false)
  const [receiptVoucherError, setReceiptVoucherError] = useState<string | null>(
    null,
  )

  const clearReceiptVoucherError = useCallback(() => {
    setReceiptVoucherError(null)
  }, [])

  const createReceiptVoucher = useCallback(
  async (payload: CreateReceiptVoucherPayload) => {
    setLoadingReceiptVoucher(true)
    setReceiptVoucherError(null)

    try {
      const response = await fetch(`${API_URL}/receipt-vouchers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || "Impossible de créer le bon de réception.",
        )
      }

      return data as CreateReceiptVoucherResponse
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de créer le bon de réception."

      setReceiptVoucherError(message)
      return null
    } finally {
      setLoadingReceiptVoucher(false)
    }
  },
  [],
)

  const value = useMemo(
    () => ({
      createReceiptVoucher,
      loadingReceiptVoucher,
      receiptVoucherError,
      clearReceiptVoucherError,
    }),
    [
      createReceiptVoucher,
      loadingReceiptVoucher,
      receiptVoucherError,
      clearReceiptVoucherError,
    ],
  )

  return (
    <ReceiptVoucherContext.Provider value={value}>
      {children}
    </ReceiptVoucherContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useReceiptVoucher = () => {
  const context = useContext(ReceiptVoucherContext)

  if (!context) {
    throw new Error(
      "useReceiptVoucher must be used inside a ReceiptVoucherProvider",
    )
  }

  return context
}