import { type ReactNode } from "react"
import { type LucideIcon } from "lucide-react"

type FieldProps = {
  children: ReactNode
  helpText?: string
  icon?: LucideIcon
  label: string
  optional?: boolean
  optionnelle?: boolean
}

export const Field = ({
  children,
  helpText,
  icon: Icon,
  label,
  optional,
  optionnelle,
}: FieldProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-white shadow-sm shadow-secondary/20">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 pt-0.5">
        <label className="block font-bold text-slate-900">
          {label}
          {optional && (
            <span className="ml-2 font-medium text-slate-500">Optionnel</span>
          )}
          {optionnelle && (
            <span className="ml-2 font-medium text-slate-500">Optionnelle</span>
          )}
        </label>

        {helpText && (
          <p className="mt-0.5 text-xs text-slate-500">{helpText}</p>
        )}
      </div>
    </div>

    {children}
  </div>
)

export default Field