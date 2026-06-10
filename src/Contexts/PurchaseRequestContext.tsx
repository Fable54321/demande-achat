import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

const API_URL = import.meta.env.VITE_API_URL

export type PurchaseRequestStatus =
  | "pending_buyer_validation"
  | "needs_requester_info"
  | "pending_admin_approval"
  | "approved"
  | "rejected"
  | "ready_to_purchase"
  | "purchased"
  | "cancelled"

interface PurchaseRequestFormTokenResponse {
  token: string
  expires_at: string
}

export interface PurchaseRequest {
  id: number

  requested_by: string
requested_at: string

description: string
quantity: number
reason: string | null

  urgency: "normal" | "priority" | "urgent" | string | null
  expected_date: string | null

  requested_unit_price: number | null
  requested_total_price: number | null
  buyer_confirmed_unit_price: number | null
  buyer_confirmed_total_price: number | null
  final_unit_price: number | null
  final_total_price: number | null

  requested_supplier: string | null
  buyer_confirmed_supplier: string | null
  product_link: string | null

  status: PurchaseRequestStatus

  buyer_user_id: number | null
  buyer_validated_at: string | null
  buyer_note: string | null

  admin_user_id: number | null
  admin_decision_at: string | null
  admin_note: string | null

  purchased_by_user_id: number | null
  purchased_at: string | null
  purchase_reference: string | null
  purchase_note: string | null

  rejection_reason: string | null

  created_at: string
  updated_at: string
  buyer_name?: string | null
  buyer_surname?: string | null
  admin_name?: string | null
  admin_surname?: string | null
  purchased_by_name?: string | null
  purchased_by_surname?: string | null
}

export interface CreatePurchaseRequestPayload {
  requested_by: string
  description: string
  quantity?: number
  reason?: string | null
  requested_unit_price?: number | null
  requested_supplier?: string | null
  product_link?: string | null
  expected_date?: string | null
}

export interface BuyerValidationPayload {
  buyer_user_id?: number | null
  buyer_confirmed_unit_price?: number | null
  buyer_confirmed_supplier?: string | null
  buyer_note?: string | null
  needs_requester_info?: boolean
  reject?: boolean
  rejection_reason?: string | null
}

export interface AdminDecisionPayload {
  admin_user_id: number
  approved: boolean
  admin_note?: string | null
  rejection_reason?: string | null
}

export interface MarkPurchasedPayload {
  purchased_by_user_id: number
  final_unit_price?: number | null
  purchase_reference?: string | null
  purchase_note?: string | null
}

interface PurchaseRequestsContextType {
  purchaseRequests: PurchaseRequest[]
  selectedPurchaseRequest: PurchaseRequest | null
  loading: boolean
  error: string | null

  fetchPurchaseRequests: (status?: PurchaseRequestStatus) => Promise<void>
  fetchPurchaseRequestById: (id: number) => Promise<PurchaseRequest | null>
getPurchaseRequestFormToken: () => Promise<string | null>
createPurchaseRequest: (
  formData: FormData,
  formToken: string
) => Promise<PurchaseRequest | null>
  validateBuyerPrice: (
    id: number,
    token: string,
    payload: BuyerValidationPayload
  ) => Promise<PurchaseRequest | null>
  saveAdminDecision: (
    id: number,
    payload: AdminDecisionPayload
  ) => Promise<PurchaseRequest | null>
  markPurchaseRequestAsPurchased: (
    id: number,
    payload: MarkPurchasedPayload
  ) => Promise<PurchaseRequest | null>
  cancelPurchaseRequest: (
    id: number,
    rejection_reason?: string
  ) => Promise<PurchaseRequest | null>
  clearSelectedPurchaseRequest: () => void
}

const PurchaseRequestsContext = createContext<
  PurchaseRequestsContextType | undefined
>(undefined)

const request = async <T,>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
 const headers =
  options.body instanceof FormData
    ? options.headers
    : {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      }

 const response = await fetch(`${API_URL}${path}`, {
  ...options,
  credentials: "include",
  headers,
})

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || "Une erreur est survenue")
  }

  return data as T
}

export const PurchaseRequestsProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] =
    useState<PurchaseRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchaseRequests = useCallback(
    async (status?: PurchaseRequestStatus) => {
      try {
        setLoading(true)
        setError(null)

        const query = status ? `?status=${encodeURIComponent(status)}` : ""

        const data = await request<PurchaseRequest[]>(
          `/purchase-request${query}`
        )

        setPurchaseRequests(data)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des demandes d'achat"

        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const fetchPurchaseRequestById = useCallback(async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const data = await request<PurchaseRequest>(`/purchase-request/${id}`)

      setSelectedPurchaseRequest(data)

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
  }, [])

  const getPurchaseRequestFormToken = useCallback(async () => {
  try {
    setError(null)

    const data = await request<PurchaseRequestFormTokenResponse>(
      "/purchase-request/form-token"
    )

    return data.token
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la préparation du formulaire"

    setError(message)
    return null
  }
}, [])

const createPurchaseRequest = useCallback(
  async (formData: FormData, formToken: string) => {
    try {
      setLoading(true)
      setError(null)

      const data = await request<PurchaseRequest>("/purchase-request", {
        method: "POST",
        headers: {
          "x-purchase-request-form-token": formToken,
        },
        body: formData,
      })

      setPurchaseRequests((prev) => [data, ...prev])

      return data
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la demande d'achat"

      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  },
  []
)

  const validateBuyerPrice = useCallback(
  async (id: number, token: string, payload: BuyerValidationPayload) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<PurchaseRequest>(
          `/purchase-request/${id}/buyer-validation/${encodeURIComponent(token)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )

        setPurchaseRequests((prev) =>
          prev.map((request) => (request.id === id ? data : request))
        )

        setSelectedPurchaseRequest((prev) =>
          prev?.id === id ? data : prev
        )

        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de la validation du prix"

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const saveAdminDecision = useCallback(
    async (id: number, payload: AdminDecisionPayload) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<PurchaseRequest>(
          `/purchase-request/${id}/admin-decision`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )

        setPurchaseRequests((prev) =>
          prev.map((request) => (request.id === id ? data : request))
        )

        setSelectedPurchaseRequest((prev) =>
          prev?.id === id ? data : prev
        )

        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement de la décision"

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const markPurchaseRequestAsPurchased = useCallback(
    async (id: number, payload: MarkPurchasedPayload) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<PurchaseRequest>(
          `/purchase-request/${id}/mark-purchased`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )

        setPurchaseRequests((prev) =>
          prev.map((request) => (request.id === id ? data : request))
        )

        setSelectedPurchaseRequest((prev) =>
          prev?.id === id ? data : prev
        )

        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors du marquage comme acheté"

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const cancelPurchaseRequest = useCallback(
    async (id: number, rejection_reason?: string) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<PurchaseRequest>(
          `/purchase-request/${id}/cancel`,
          {
            method: "PATCH",
            body: JSON.stringify({
              rejection_reason: rejection_reason || null,
            }),
          }
        )

        setPurchaseRequests((prev) =>
          prev.map((request) => (request.id === id ? data : request))
        )

        setSelectedPurchaseRequest((prev) =>
          prev?.id === id ? data : prev
        )

        return data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de l'annulation de la demande"

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const clearSelectedPurchaseRequest = useCallback(() => {
    setSelectedPurchaseRequest(null)
  }, [])

  return (
    <PurchaseRequestsContext.Provider
   value={{
  purchaseRequests,
  selectedPurchaseRequest,
  loading,
  error,
  fetchPurchaseRequests,
  fetchPurchaseRequestById,
  getPurchaseRequestFormToken,
  createPurchaseRequest,
  validateBuyerPrice,
  saveAdminDecision,
  markPurchaseRequestAsPurchased,
  cancelPurchaseRequest,
  clearSelectedPurchaseRequest,
}}
    >
      {children}
    </PurchaseRequestsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePurchaseRequests = () => {
  const context = useContext(PurchaseRequestsContext)

  if (!context) {
    throw new Error(
      "usePurchaseRequests must be used within a PurchaseRequestsProvider"
    )
  }

  return context
}
