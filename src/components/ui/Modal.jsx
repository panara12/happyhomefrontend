import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
};

/**
 * Shared modal shell:
 * - locks background scroll
 * - caps height so only the body scrolls when needed
 * - sticky header / footer
 */
export default function Modal({
  open = true,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  className = '',
  bodyClassName = '',
  closeOnBackdrop = true,
}) {
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${SIZE_CLASS[size] || SIZE_CLASS.md} max-h-[90vh] flex flex-col overflow-hidden ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title != null && (
          <div className="shrink-0 px-5 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
            {typeof title === 'string' ? (
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            ) : (
              title
            )}
          </div>
        )}

        <div className={`thin-scroll px-5 sm:px-6 py-4 overflow-y-auto overscroll-contain min-h-0 ${bodyClassName}`}>
          {children}
        </div>

        {footer != null && (
          <div className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-center gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const modalInputClass =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm bg-white';

export const modalSelectClass =
  'w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm bg-white';

export const modalLabelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export const modalSecondaryBtnClass =
  'w-full sm:w-48 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center shrink-0';

export const modalPrimaryBtnClass =
  'w-full sm:w-48 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all text-sm font-medium text-center shrink-0 disabled:opacity-60';
