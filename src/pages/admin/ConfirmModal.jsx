import Modal, { modalSecondaryBtnClass } from '../../components/ui/Modal';

const confirmBtnBase =
  'w-full sm:w-48 px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium text-center shrink-0';

// Shared by the delete and activate confirmation dialogs — same layout,
// only the copy and confirm button color differ between the two actions.
export function ConfirmModal({ title, message, confirmLabel, confirmClassName, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={modalSecondaryBtnClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${confirmBtnBase} ${confirmClassName || 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-gray-700 text-sm">{message}</p>
    </Modal>
  );
}
