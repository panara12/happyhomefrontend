import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';

const USER_TYPE_OPTIONS = [
  { value: 'sales', label: 'Sales Person' },
  { value: 'manager', label: 'Manager' },
  { value: 'accounting', label: 'Accounting' },
];

// Shared by both the Add and Update flows — same fields, only the title,
// submit label, and submit handler differ between the two modes.
export function UserFormModal({ mode, formData, setFormData, stores, onSubmit, onClose }) {
  const isEdit = mode === 'edit';
  const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <Modal
      title={isEdit ? 'Update User' : 'Add New User'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className={modalSecondaryBtnClass}>
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className={modalPrimaryBtnClass}>
            {isEdit ? 'Update User' : 'Add User'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <label className={modalLabelClass}>Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={updateField('fullName')}
            className={modalInputClass}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className={modalLabelClass}>Username *</label>
          <input
            type="text"
            value={formData.username}
            onChange={updateField('username')}
            className={modalInputClass}
            placeholder="johndoe"
          />
        </div>
        <div>
          <label className={modalLabelClass}>Mobile Number *</label>
          <input
            type="text"
            value={formData.mobile}
            onChange={updateField('mobile')}
            className={modalInputClass}
            placeholder="1234567890"
          />
        </div>
        <div>
          <label className={modalLabelClass}>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={updateField('email')}
            className={modalInputClass}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className={modalLabelClass}>Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={updateField('password')}
            className={modalInputClass}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className={modalLabelClass}>User Role</label>
          <select
            value={formData.userType}
            onChange={updateField('userType')}
            className={modalInputClass}
          >
            <option value="">Select a role</option>
            {USER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={modalLabelClass}>Assign Store</label>
          <select
            value={formData.storeId}
            onChange={updateField('storeId')}
            className={modalInputClass}
          >
            <option value="">Select a store</option>
            {stores.map((store) => (
              <option key={store.storeId} value={store.storeId}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
