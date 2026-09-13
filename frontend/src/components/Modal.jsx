export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors duration-150 hover:bg-panelHover hover:text-gray-200"
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
