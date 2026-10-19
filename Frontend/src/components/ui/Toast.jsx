import { useEffect, useState } from "react";
import { CircleCheck, TriangleAlert, Info, X } from "lucide-react";
import { toastListeners } from "./toastStore";



const icons = { success: CircleCheck, error: TriangleAlert, info: Info };

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const add = (item) => {
      setItems((current) => [...current.slice(-3), item]);
      setTimeout(() => setItems((current) => current.filter((t) => t.id !== item.id)), item.duration);
    };
    toastListeners.add(add);
    return () => toastListeners.delete(add);
  }, []);

  const dismiss = (id) => setItems((current) => current.filter((t) => t.id !== id));

  return (
    <div className="cf-toaster" role="region" aria-label="Notifications">
      {items.map(({ id, type, message }) => {
        const Icon = icons[type];
        return (
          <div key={id} className={`cf-toast is-${type}`} role={type === "error" ? "alert" : "status"}>
            <Icon size={16} className="cf-toast-icon" aria-hidden="true" />
            <p>{message}</p>
            <button type="button" onClick={() => dismiss(id)} aria-label="Dismiss notification"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
