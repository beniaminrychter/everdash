import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { Check, Info, X } from 'lucide-react';

export const toastManager = ToastPrimitive.createToastManager();

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((item) => (
    <ToastPrimitive.Root key={item.id} toast={item} className="toast-root">
      <ToastPrimitive.Content className="toast-content">
        {item.type === 'success' ? <Check size={17} /> : <Info size={17} />}
        <div className="toast-copy">
          <ToastPrimitive.Title className="toast-title" />
          <ToastPrimitive.Description className="toast-description" />
        </div>
      </ToastPrimitive.Content>
      <ToastPrimitive.Close className="toast-close" aria-label="Dismiss notification">
        <X size={16} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ));
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="toast-viewport" aria-label="Notifications">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
