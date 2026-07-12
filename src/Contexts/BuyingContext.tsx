import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import type { PurchaseRequest } from "./PurchaseRequestContext"

const API_URL = import.meta.env.VITE_API_URL

export type PurchaseMode = "full" | "partial"

export interface Supplier {
  id: number
  name: string
  address_snapshot: string | null
  phone: string | null
  supplier_phone?: string | null
  email: string | null
  contact_name: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: number
  purchase_request_id: number

  purchase_order_reference: string
  purchase_order_sequence: number
  purchase_order_subsequence: number | null

  supplier_id: number | null
  supplier: string | null
  supplier_name: string | null
  supplier_address_snapshot: string | null
  supplier_phone: string | null

  purchased_by_user_id: number | null
  purchased_at: string | null

  supplier_reference: string | null
  purchase_note: string | null

  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null

  requested_delivery_date: string | null
  received_at: string | null
  invoice_number: string | null
  delivery_method: string | null
  shipping_address_snapshot: string | null
  purchase_document_keys?: string[] | null
  currency_code: string

  status: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  purchase_request_item_id: number

  ordered_quantity: number
  final_unit_price: number | null
  final_total_price: number | null

  item_code: string | null
  number_of_pallets: number | null
  item_description: string | null
  ordered_unit: string | null
  location: string | null

  created_at: string
  updated_at: string
}

export interface PurchaseOrderItemPayload {
  purchase_request_item_id: number
  ordered_quantity: number

  final_unit_price?: number | null
  final_total_price?: number | null
  item_code?: string | null
  item_description?: string | null
  ordered_unit?: string | null
}

export interface CreatePurchaseOrderPayload {
  purchase_mode: PurchaseMode

  supplier_id?: number | null
  supplier_name?: string | null
  supplier_address_snapshot?: string | null
  supplier_phone?: string | null

  buyer_name?: string | null
  buyer_email?: string | null
  buyer_phone?: string | null

  requested_delivery_date?: string | null
  delivery_method?: string | null
  shipping_address_snapshot?: string | null

  purchase_note?: string | null
  purchased_by_user_id: number
  ordered_at?: string | null
  currency_code?: string | null

  items: PurchaseOrderItemPayload[]
}

export interface CreatePurchaseOrderResponse {
  purchase_request: PurchaseRequest
  purchase_order: PurchaseOrder
  purchase_order_items: PurchaseOrderItem[]
  purchase_order_pdf_urls?: string[]
  purchase_order_pdf_preview_urls?: string[]
  purchase_order_pdf_download_urls?: string[]
  purchase_order_pdfs?: Array<{
    key: string
    language: "fr" | "en"
    preview_url: string
    download_url: string
  }>
  purchase_order_pdf?: {
    key: string
    language?: "fr" | "en"
    url?: string
    preview_url?: string
    download_url?: string
  }
}

interface BuyingContextType {
  buyingRequest: PurchaseRequest | null
  suppliers: Supplier[]
  lastCreatedPurchaseOrder: PurchaseOrder | null
  lastCreatedPurchaseOrderItems: PurchaseOrderItem[]
  loading: boolean
  error: string | null

  fetchBuyingRequestByToken: (
    id: number,
    token: string,
  ) => Promise<PurchaseRequest | null>

  fetchSuppliers: () => Promise<Supplier[]>

  createPurchaseOrder: (
    id: number,
    token: string,
    payload: CreatePurchaseOrderPayload,
  ) => Promise<CreatePurchaseOrderResponse | null>

  clearBuyingRequest: () => void
  clearBuyingError: () => void
}

const BuyingContext = createContext<BuyingContextType | undefined>(undefined)

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

  return data
}

export const BuyingProvider = ({ children }: { children: ReactNode }) => {
  const [buyingRequest, setBuyingRequest] = useState<PurchaseRequest | null>(
    null,
  )
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [lastCreatedPurchaseOrder, setLastCreatedPurchaseOrder] =
    useState<PurchaseOrder | null>(null)
  const [lastCreatedPurchaseOrderItems, setLastCreatedPurchaseOrderItems] =
    useState<PurchaseOrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBuyingRequestByToken = useCallback(
    async (id: number, token: string) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<PurchaseRequest>(
          `/buying/${id}/${encodeURIComponent(token)}`,
        )

        setBuyingRequest(data)
        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement de la demande d'achat"

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await request<Supplier[]>("/suppliers/suppliers")

      setSuppliers(data)
      return data
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des fournisseurs"

      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createPurchaseOrder = useCallback(
    async (
      id: number,
      token: string,
      payload: CreatePurchaseOrderPayload,
    ) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<CreatePurchaseOrderResponse>(
          `/buying/${id}/${encodeURIComponent(token)}`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        )

        setBuyingRequest(data.purchase_request)
        setLastCreatedPurchaseOrder(data.purchase_order)
        setLastCreatedPurchaseOrderItems(data.purchase_order_items)

        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de la création du bon d'achat"

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const clearBuyingRequest = useCallback(() => {
    setBuyingRequest(null)
    setLastCreatedPurchaseOrder(null)
    setLastCreatedPurchaseOrderItems([])
    setError(null)
  }, [])

  const clearBuyingError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <BuyingContext.Provider
      value={{
        buyingRequest,
        suppliers,
        lastCreatedPurchaseOrder,
        lastCreatedPurchaseOrderItems,
        loading,
        error,
        fetchBuyingRequestByToken,
        fetchSuppliers,
        createPurchaseOrder,
        clearBuyingRequest,
        clearBuyingError,
      }}
    >
      {children}
    </BuyingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBuying = () => {
  const context = useContext(BuyingContext)

  if (!context) {
    throw new Error("useBuying must be used within a BuyingProvider")
  }

  return context
}
