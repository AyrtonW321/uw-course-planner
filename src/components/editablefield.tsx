import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPen } from "@fortawesome/free-solid-svg-icons"

function EditableField({
  label,
  editing,
  onEdit,
  children,
}: {
  label: string
  editing: boolean
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm text-slate-200">{label}</label>
      <div className="group relative">
        {children}
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70 p-1.5 text-slate-200 hover:bg-slate-800 group-hover:flex"
            aria-label={`Edit ${label}`}
            title={`Edit ${label}`}
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
          </button>
        )}
      </div>
    </div>
  )
}
