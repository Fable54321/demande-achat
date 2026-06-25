import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const API_URL = import.meta.env.VITE_API_URL

export type EditablePurchaseRequest = {
  id: number
  request_reference: string
  requested_by: string | null
  requester_email: string | null
  status: string
  status_label: string
  urgency: string | null
  needed_by_date: string | null
  expected_date: string | null
  requested_at: string | null
  created_at: string
  updated_at: string | null
  cancelled_at: string | null
  item_count: number
  requested_total_price: number
  description: string | null
  can_modify: boolean
  can_cancel: boolean
}

export type EditablePurchaseRequestItemPayload = {
  id: number
  description: string | null
  reason: string | null
  quantity: number
  quantity_format: string | null
  requested_unit_price: number
  requested_supplier: string | null
  product_link: string | null
}

export type ModifyEditablePurchaseRequestPayload = {
  requester_email: string
  requested_by?: string | null
  needed_by_date?: string | null
  modification_reason: string
  items: EditablePurchaseRequestItemPayload[]
}

export type CancelEditablePurchaseRequestPayload = {
  requester_email: string
  cancellation_reason: string
}
export type EditablePurchaseRequestDetail = {
  request: EditablePurchaseRequest & {
    has_purchase_order: boolean
    can_modify: boolean
    can_cancel: boolean
    cancellation_reason: string | null
    modification_reason: string | null
    modified_at: string | null
  }
  items: {
    id: number
    purchase_request_id: number
    item_index: number
    description: string | null
    reason: string | null
    quantity: number
    quantity_format: string | null
    requested_unit_price: number
    requested_total_price: number
    requested_supplier: string | null
    product_link: string | null
    status: string | null
    has_purchase_order: boolean
    can_modify: boolean
  }[]
}

type EditablePurchaseRequestContextValue = {
  editableRequests: EditablePurchaseRequest[]
  isLoadingEditableRequests: boolean
  isModifyingEditableRequest: boolean
  isCancellingEditableRequest: boolean
  editableRequestError: string | null
  editableRequestSuccess: string | null
  fetchEditableRequestsByEmail: (email: string) => Promise<EditablePurchaseRequest[]>
  modifyEditablePurchaseRequest: (
    id: number,
    payload: ModifyEditablePurchaseRequestPayload,
  ) => Promise<void>
  cancelEditablePurchaseRequest: (
    id: number,
    payload: CancelEditablePurchaseRequestPayload,
  ) => Promise<void>
  clearEditableRequestMessages: () => void
}

const EditablePurchaseRequestContext =
  createContext<EditablePurchaseRequestContextValue | null>(null)

const getErrorMessage = async (
  response: Response,
  fallback: string,
) => {
  try {
    const data = await response.json()

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message
    }

    return fallback
  } catch {
    return fallback
  }
}

export const EditablePurchaseRequestProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [editableRequests, setEditableRequests] = useState<
    EditablePurchaseRequest[]
  >([])

  const [isLoadingEditableRequests, setIsLoadingEditableRequests] =
    useState(false)

  const [isModifyingEditableRequest, setIsModifyingEditableRequest] =
    useState(false)

  const [isCancellingEditableRequest, setIsCancellingEditableRequest] =
    useState(false)

  const [editableRequestError, setEditableRequestError] = useState<
    string | null
  >(null)

  const [editableRequestSuccess, setEditableRequestSuccess] = useState<
    string | null
  >(null)

  const clearEditableRequestMessages = useCallback(() => {
    setEditableRequestError(null)
    setEditableRequestSuccess(null)
  }, [])

  const fetchEditableRequestsByEmail = useCallback(async (email: string) => {
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setEditableRequests([])
      return []
    }

    setIsLoadingEditableRequests(true)
    setEditableRequestError(null)
    setEditableRequestSuccess(null)

    try {
      const response = await fetch(
        `${API_URL}/purchase-request/editable-by-email?email=${encodeURIComponent(
          cleanEmail,
        )}`,
      )

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Impossible de charger les demandes modifiables.",
        )

        throw new Error(message)
      }

      const data = (await response.json()) as EditablePurchaseRequest[]

      setEditableRequests(data)

      return data
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de charger les demandes modifiables."

      setEditableRequestError(message)
      setEditableRequests([])

      return []
    } finally {
      setIsLoadingEditableRequests(false)
    }
  }, [])

  const modifyEditablePurchaseRequest = useCallback(
    async (
      id: number,
      payload: ModifyEditablePurchaseRequestPayload,
    ) => {
      setIsModifyingEditableRequest(true)
      setEditableRequestError(null)
      setEditableRequestSuccess(null)

      try {
        const response = await fetch(
          `${API_URL}/purchase-request/${id}/editable`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        )

        if (!response.ok) {
          const message = await getErrorMessage(
            response,
            "Impossible de modifier la demande.",
          )

          throw new Error(message)
        }

        setEditableRequestSuccess("La demande a été modifiée avec succès.")

        await fetchEditableRequestsByEmail(payload.requester_email)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de modifier la demande."

        setEditableRequestError(message)

        throw error
      } finally {
        setIsModifyingEditableRequest(false)
      }
    },
    [fetchEditableRequestsByEmail],
  )

  const cancelEditablePurchaseRequest = useCallback(
    async (
      id: number,
      payload: CancelEditablePurchaseRequestPayload,
    ) => {
      setIsCancellingEditableRequest(true)
      setEditableRequestError(null)
      setEditableRequestSuccess(null)

      try {
        const response = await fetch(
          `${API_URL}/purchase-request/${id}/editable`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        )

        if (!response.ok) {
          const message = await getErrorMessage(
            response,
            "Impossible d'annuler la demande.",
          )

          throw new Error(message)
        }

        setEditableRequestSuccess("La demande a été annulée avec succès.")

        await fetchEditableRequestsByEmail(payload.requester_email)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible d'annuler la demande."

        setEditableRequestError(message)

        throw error
      } finally {
        setIsCancellingEditableRequest(false)
      }
    },
    [fetchEditableRequestsByEmail],
  )

  const fetchEditableRequestDetail = useCallback(
  async (id: number, email: string) => {
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      throw new Error("Une adresse courriel est requise.")
    }

    setIsLoadingEditableRequests(true)
    setEditableRequestError(null)
    setEditableRequestSuccess(null)

    try {
      const response = await fetch(
        `${API_URL}/purchase-request/${id}/editable?email=${encodeURIComponent(
          cleanEmail,
        )}`,
      )

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Impossible de charger la demande.",
        )

        throw new Error(message)
      }

      return (await response.json()) as EditablePurchaseRequestDetail
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de charger la demande."

      setEditableRequestError(message)

      throw error
    } finally {
      setIsLoadingEditableRequests(false)
    }
  },
  [],
)

  const value = useMemo(
    () => ({
      editableRequests,
      isLoadingEditableRequests,
      isModifyingEditableRequest,
      isCancellingEditableRequest,
      editableRequestError,
      editableRequestSuccess,
      fetchEditableRequestsByEmail,
      fetchEditableRequestDetail,
      modifyEditablePurchaseRequest,
      cancelEditablePurchaseRequest,
      clearEditableRequestMessages,
    }),
    [
      editableRequests,
      isLoadingEditableRequests,
      isModifyingEditableRequest,
      isCancellingEditableRequest,
      editableRequestError,
      editableRequestSuccess,
      fetchEditableRequestsByEmail,
      fetchEditableRequestDetail,
      modifyEditablePurchaseRequest,
      cancelEditablePurchaseRequest,
      clearEditableRequestMessages,
    ],
  )

  return (
    <EditablePurchaseRequestContext.Provider value={value}>
      {children}
    </EditablePurchaseRequestContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEditablePurchaseRequests = () => {
  const context = useContext(EditablePurchaseRequestContext)

  if (!context) {
    throw new Error(
      "useEditablePurchaseRequests must be used within an EditablePurchaseRequestProvider",
    )
  }

  return context
}