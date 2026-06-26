import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { PurchaseRequest } from "./PurchaseRequestContext"

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

export type CreateReceiptVoucherResponse = {
  purchase_request: PurchaseRequest
  receipt_voucher: ReceiptVoucher
  items: ReceiptVoucherItem[]
  ordered_total_quantity: number
  received_total_quantity: number
  has_receivable_items: boolean
}

type ReceiptVoucherContextValue = {
  receiptVoucherRequest: PurchaseRequest | null
  lastCreatedReceiptVoucher: ReceiptVoucher | null
  lastCreatedReceiptVoucherItems: ReceiptVoucherItem[]
  fetchReceiptVoucherRequestByToken: (
    id: number,
    token: string,
  ) => Promise<PurchaseRequest | null>
  createReceiptVoucher: (
    id: number,
    token: string,
    payload: CreateReceiptVoucherPayload,
  ) => Promise<CreateReceiptVoucherResponse | null>
  loadingReceiptVoucher: boolean
  receiptVoucherError: string | null
  clearReceiptVoucherError: () => void
}

const ReceiptVoucherContext = createContext<ReceiptVoucherContextValue | null>(
  null,
)

const request = async <T,>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers:
      options.body instanceof FormData
        ? options.headers
        : {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
          },
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || "Une erreur est survenue")
  }

  return data as T
}

export const ReceiptVoucherProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [receiptVoucherRequest, setReceiptVoucherRequest] =
    useState<PurchaseRequest | null>(null)
  const [lastCreatedReceiptVoucher, setLastCreatedReceiptVoucher] =
    useState<ReceiptVoucher | null>(null)
  const [
    lastCreatedReceiptVoucherItems,
    setLastCreatedReceiptVoucherItems,
  ] = useState<ReceiptVoucherItem[]>([])
  const [loadingReceiptVoucher, setLoadingReceiptVoucher] = useState(false)
  const [receiptVoucherError, setReceiptVoucherError] = useState<string | null>(
    null,
  )

  const clearReceiptVoucherError = useCallback(() => {
    setReceiptVoucherError(null)
  }, [])

  const fetchReceiptVoucherRequestByToken = useCallback(
    async (id: number, token: string) => {
      try {
        setLoadingReceiptVoucher(true)
        setReceiptVoucherError(null)
        setReceiptVoucherRequest(null)

        const data = await request<PurchaseRequest>(
          `/purchase-request/${id}/reception/${encodeURIComponent(token)}`,
        )

        setReceiptVoucherRequest(data)
        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Lien de réception invalide ou expiré."

        setReceiptVoucherError(message)
        return null
      } finally {
        setLoadingReceiptVoucher(false)
      }
    },
    [],
  )

  const createReceiptVoucher = useCallback(
    async (
      id: number,
      token: string,
      payload: CreateReceiptVoucherPayload,
    ) => {
      try {
        setLoadingReceiptVoucher(true)
        setReceiptVoucherError(null)

        const data = await request<CreateReceiptVoucherResponse>(
          `/receipt-vouchers/${id}/reception/${encodeURIComponent(token)}`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        )

        setReceiptVoucherRequest(data.purchase_request)
        setLastCreatedReceiptVoucher(data.receipt_voucher)
        setLastCreatedReceiptVoucherItems(data.items)

        return data
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
      receiptVoucherRequest,
      lastCreatedReceiptVoucher,
      lastCreatedReceiptVoucherItems,
      fetchReceiptVoucherRequestByToken,
      createReceiptVoucher,
      loadingReceiptVoucher,
      receiptVoucherError,
      clearReceiptVoucherError,
    }),
    [
      receiptVoucherRequest,
      lastCreatedReceiptVoucher,
      lastCreatedReceiptVoucherItems,
      fetchReceiptVoucherRequestByToken,
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
