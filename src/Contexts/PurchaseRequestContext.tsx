import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const API_URL = import.meta.env.VITE_API_URL

export type PurchaseRequestStatus =
  | "pending_buyer_validation"
  | "needs_requester_info"
  | "pending_admin_approval"
  | "admin_on_wait"
  | "rejected"
  | "ready_to_purchase"
  | "partially_purchased"
  | "purchased"
  | "partially_received"
  | "received"
  | "cancelled"

interface PurchaseRequestFormTokenResponse {
  token: string
  expires_at: string
}

export interface PurchaseRequestItem {
  id: number
  purchase_request_id: number
  item_index: number

  description: string
  reason: string | null

  quantity: number
  quantity_format: string | null

  requested_unit_price: number | null
  requested_total_price: number | null
  requested_supplier: string | null
  product_link: string | null

  buyer_confirmed_unit_price: number | null
  buyer_confirmed_total_price: number | null
  buyer_confirmed_supplier: string | null

  status: PurchaseRequestStatus | string

  created_at: string
  updated_at: string
  has_purchase_order?: boolean
  ordered_quantity?: number
  remaining_quantity?: number
  is_fully_purchased?: boolean
}

export interface PurchaseRequest {
  id: number

  request_reference: string
  request_year: number
  request_month: number
  request_month_sequence: number

  requested_by: string
  requester_email: string | null
  requested_at: string

  status: PurchaseRequestStatus

  urgency: "normal" | "priority" | "urgent" | string | null
  needed_by_date: string | null
  expected_date: string | null
  date_changed: boolean

  buyer_user_id: number | null
  buyer_validated_at: string | null
  buyer_note: string | null
  buyer_email: string | null

  admin_user_id: number | null
  admin_decision: string | null
  admin_decision_at: string | null
  admin_note: string | null
  admin_email: string | null

  rejection_reason: string | null

  direct_approval_requested: boolean
  direct_approval_approver: "Ricardo" | "Michelle" | null
  direct_approval_requested_at: string | null

  picture_keys: string[]

  created_at: string
  updated_at: string

  buyer_name?: string | null
  buyer_surname?: string | null
  admin_name?: string | null
  admin_surname?: string | null
  purchased_by_name?: string | null
  purchased_by_surname?: string | null

  items: PurchaseRequestItem[]
}

export interface CreatePurchaseRequestItemPayload {
  description: string
  quantity: number
  quantity_format?: string | null
  reason?: string | null
  requested_unit_price?: number | null
  requested_supplier?: string | null
  product_link?: string | null
}

export interface CreatePurchaseRequestPayload {
  requested_by: string
  requester_email?: string | null
  needed_by_date?: string | null
  items: CreatePurchaseRequestItemPayload[]
}

export interface BuyerValidationItemPayload {
  id: number
  buyer_confirmed_unit_price?: number | string | null
  buyer_confirmed_supplier?: string | null
}

export interface BuyerValidationPayload {
  buyer_user_id?: number | null
  expected_date?: string | null
  buyer_note?: string | null
  direct_approval_requested?: boolean
  direct_approval_approver?: "Ricardo" | "Michelle" | null
  needs_requester_info?: boolean
  reject?: boolean
  rejection_reason?: string | null
  items?: BuyerValidationItemPayload[]
}

export interface Employee {
  id: number
  name: string
  surname?: string | null
  email?: string | null
  is_office?: boolean
}

export interface EmployeeListResponse {
  users: Employee[]
}

export type TokenedPurchaseRequestReadRoute =
  | "buyer-validation"
  | "validation-prix"
  | "admin-decision"
  | "approbation-achat"

export interface AdminDecisionPayload {
  decision: "approved" | "on_wait" | "rejected"
  admin_note?: string | null
  rejection_reason?: string | null
}

interface PurchaseRequestsContextType {
  purchaseRequests: PurchaseRequest[]
  selectedPurchaseRequest: PurchaseRequest | null
  loading: boolean
  error: string | null
  employees: Employee[]

  fetchPurchaseRequests: (status?: PurchaseRequestStatus) => Promise<void>
  fetchPurchaseRequestById: (id: number) => Promise<PurchaseRequest | null>

  getPurchaseRequestFormToken: () => Promise<PurchaseRequestFormTokenResponse | null>

  getPurchaseRequestByToken: (
    id: number,
    token: string,
    route: TokenedPurchaseRequestReadRoute
  ) => Promise<PurchaseRequest | null>

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
    token: string,
    payload: AdminDecisionPayload
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
  const [employees, setEmployees] = useState<Employee[]>([])

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



const getPurchaseRequestByToken = useCallback(
  async (
    id: number,
    token: string,
    route: TokenedPurchaseRequestReadRoute
  ) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedPurchaseRequest(null)

      const data = await request<PurchaseRequest>(
        `/purchase-request/${id}/${route}/${encodeURIComponent(token)}`
      )

      setSelectedPurchaseRequest(data)

      return data
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Lien invalide, expiré ou déjà utilisé"

      setSelectedPurchaseRequest(null)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  },
  []
)


useEffect(() => {
  let cancelled = false

  const getEmployees = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await request<EmployeeListResponse>("/portal-unprotected/list")

      if (!cancelled) {
        setEmployees(data.users)
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des employés"

      if (!cancelled) {
        setError(message)
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  getEmployees()

  return () => {
    cancelled = true
  }
}, [])

  const getPurchaseRequestFormToken = useCallback(async () => {
  try {
    setError(null)

    const data = await request<PurchaseRequestFormTokenResponse>(
      "/purchase-request/form-token"
    )

    return data
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
    async (id: number, token: string, payload: AdminDecisionPayload) => {
      try {
        setLoading(true)
        setError(null)

        const data = await request<PurchaseRequest>(
          `/purchase-request/${id}/admin-decision/${encodeURIComponent(token)}`,
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
  employees,
  fetchPurchaseRequests,
  fetchPurchaseRequestById,
  getPurchaseRequestFormToken,
  getPurchaseRequestByToken,
  createPurchaseRequest,
  validateBuyerPrice,
  saveAdminDecision,
  
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
