export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted transition-colors duration-150 hover:bg-panelHover hover:text-ink-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
