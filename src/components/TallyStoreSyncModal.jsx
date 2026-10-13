import { useEffect, useMemo, useState } from 'react';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from './ui/Modal';

export default function TallyStoreSyncModal({ open, stores = [], records = [], recordType = null, isPending = false, onClose, onConfirm, title = 'Sync to Tally' }) {
  const availableStores = useMemo(
    () => stores.filter((store) => store?.storeId),
    [stores]
  );
  const [storeId, setStoreId] = useState('');
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [activeInvoiceTab, setActiveInvoiceTab] = useState('pending');

  const storeRecords = useMemo(() => records.filter((record) =>
    String(record.storeId || record.store?.storeId || '') === String(storeId)
      && (recordType !== 'invoice' || (record.status === 'approved' && !record.isEdited))
  ), [records, recordType, storeId]);
  const isRecordSynced = (record) => record.tallySync?.synced || record.tallySync?.status === 'synced';
  const pendingRecords = storeRecords.filter((record) => !isRecordSynced(record));
  const syncedRecords = storeRecords.filter(isRecordSynced);
  const visibleRecords = activeInvoiceTab === 'pending' ? pendingRecords : syncedRecords;

  useEffect(() => {
    if (!open) return;
    setStoreId(availableStores.length === 1 ? String(availableStores[0].storeId) : '');
    setSelectedRecordIds([]);
    setActiveInvoiceTab('pending');
  }, [open, availableStores]);

  useEffect(() => setSelectedRecordIds([]), [storeId]);

  const allSelected = visibleRecords.length > 0 && visibleRecords.every((record) => selectedRecordIds.includes(String(record._id || record.id)));
  const toggleAll = () => {
    const visibleIds = visibleRecords.map((record) => String(record._id || record.id));
    setSelectedRecordIds((current) => allSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };
  const toggleRecord = (id) => setSelectedRecordIds((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (storeId) onConfirm?.(recordType
      ? { storeId, [recordType === 'invoice' ? 'invoiceIds' : 'purchaseBillIds']: selectedRecordIds }
      : storeId);
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
          <button type="submit" form="tally-store-sync-form" disabled={!storeId || isPending || (recordType && selectedRecordIds.length === 0)} className={`${modalPrimaryBtnClass} text-black`}>
            {isPending ? 'Syncing…' : recordType ? `Sync selected (${selectedRecordIds.length})` : 'Sync selected store'}
          </button>
        </>
      )}
    >
      <form id="tally-store-sync-form" onSubmit={handleSubmit} className="space-y-4">
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
        {storeId && recordType && (
          <section className="space-y-2">
            <div className="flex gap-2 border-b border-gray-200">
              {[
                { id: 'pending', label: 'Pending Sync', count: pendingRecords.length },
                { id: 'synced', label: 'Synced', count: syncedRecords.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveInvoiceTab(tab.id)}
                  className={`border-b-2 px-3 py-2 text-sm font-medium ${activeInvoiceTab === tab.id ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label} <span className="ml-1 text-xs">({tab.count})</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className={modalLabelClass}>{activeInvoiceTab === 'pending' ? `${recordType === 'invoice' ? 'Invoices' : 'Purchase bills'} to sync` : `Previously synced ${recordType === 'invoice' ? 'invoices' : 'purchase bills'}`}</p>
              <button type="button" onClick={toggleAll} disabled={isPending || visibleRecords.length === 0} className="text-sm font-medium text-amber-700 disabled:text-gray-400">
                {allSelected ? 'Clear selection' : 'Select all'}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {visibleRecords.length ? visibleRecords.map((record) => {
                const id = String(record._id || record.id);
                const synced = isRecordSynced(record);
                const recordLabel = record.invoiceNumber || record.billNumber || record.billId || record.reference || id;
                return <label key={id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-50">
                  <input type="checkbox" checked={selectedRecordIds.includes(id)} onChange={() => toggleRecord(id)} disabled={isPending} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">{recordLabel}{record.customerName ? ` · ${record.customerName}` : record.supplierName ? ` · ${record.supplierName}` : ''}</span>
                    <span className="text-xs text-gray-500">{new Date(record.approvedAt || record.billDate || record.createdAt).toLocaleDateString('en-IN')} · ₹{Number(record.total ?? record.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${synced ? 'bg-green-100 text-green-700' : record.tallySync?.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{synced ? 'Synced' : record.tallySync?.status === 'failed' ? 'Failed' : 'Not synced'}</span>
                </label>;
              }) : <p className="p-4 text-sm text-gray-500">No {recordType === 'invoice' ? 'approved invoices' : 'purchase bills'} in this tab for this company.</p>}
            </div>
          </section>
        )}
      </form>
    </Modal>
  );
}
