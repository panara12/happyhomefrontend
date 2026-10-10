import { useEffect, useMemo, useState } from 'react';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from './ui/Modal';

export default function TallyStoreSyncModal({ open, stores = [], isPending = false, onClose, onConfirm, title = 'Sync to Tally' }) {
  const availableStores = useMemo(
    () => stores.filter((store) => store?.storeId),
    [stores]
  );
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    if (!open) return;
    setStoreId(availableStores.length === 1 ? String(availableStores[0].storeId) : '');
  }, [open, availableStores]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (storeId) onConfirm?.(storeId);
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isPending}
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={isPending} className={`${modalSecondaryBtnClass} text-black`}>
            Cancel
          </button>
          <button type="submit" form="tally-store-sync-form" disabled={!storeId || isPending} className={`${modalPrimaryBtnClass} text-black`}>
            {isPending ? 'Syncing…' : 'Sync selected store'}
          </button>
        </>
      )}
    >
      <form id="tally-store-sync-form" onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="tally-sync-store" className={modalLabelClass}>
          Store and Tally company
        </label>
        <select
          id="tally-sync-store"
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
          className={`${modalInputClass} text-gray-900 bg-white`}
          required
          disabled={isPending || availableStores.length === 0}
        >
          <option value="" className="text-gray-900 bg-white">Select a store</option>
          {availableStores.map((store) => (
            <option key={store.storeId} value={store.storeId} className="text-gray-900 bg-white">
              {store.name} — {store.tallyCompanyName?.trim() || store.name}
            </option>
          ))}
        </select>
        {availableStores.length === 0 && (
          <p className="text-sm text-red-600">No stores are available for Tally sync.</p>
        )}
      </form>
    </Modal>
  );
}
