import { useEffect, useRef, useState } from "react";
import { setConfirmOpener } from "./confirmStore";

/** Renders confirm dialogs requested through confirmDialog() in confirmStore.js. */
export function ConfirmHost() {
  const ref = useRef(null);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    setConfirmOpener((req) => setRequest(req));
    return () => setConfirmOpener(null);
  }, []);

  useEffect(() => {
    if (request && ref.current && !ref.current.open) ref.current.showModal();
  }, [request]);

  const settle = (value) => {
    request?.resolve(value);
    ref.current?.close();
    setRequest(null);
  };

  return (
    <dialog ref={ref} className="cf-dialog" onCancel={(e) => { e.preventDefault(); settle(false); }}
      onClick={(e) => { if (e.target === ref.current) settle(false); }}>
      {request && (
        <div className="cf-dialog-body">
          <h2>{request.title}</h2>
          {request.body && <p>{request.body}</p>}
          <div className="cf-dialog-actions">
            <button type="button" className="cf-secondary-button" onClick={() => settle(false)}>{request.cancelLabel || "Cancel"}</button>
            <button type="button" className={request.danger ? "cf-danger-button" : "cf-primary-button"} onClick={() => settle(true)} autoFocus>
              {request.confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
