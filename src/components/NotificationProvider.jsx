import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NotificationContext } from "../contexts/NotificationContext";
import "../styles/Notifications.css";

const DEFAULT_DURATION = 5000;

function NotificationViewport({ notifications, onDismiss }) {
  return (
    <div className="notification-viewport" aria-label="Alkalmazásértesítések">
      {notifications.map((notification) => (
        <section
          className={`notification notification-${notification.type}`}
          key={notification.id}
          role={notification.type === "error" ? "alert" : "status"}
          aria-live={notification.type === "error" ? "assertive" : "polite"}
        >
          <span className="notification-icon" aria-hidden="true">
            {{ success: "✓", error: "!", warning: "!", info: "i" }[notification.type]}
          </span>
          <p>{notification.message}</p>
          <button
            className="notification-dismiss"
            type="button"
            aria-label="Értesítés bezárása"
            onClick={() => onDismiss(notification.id)}
          >
            ×
          </button>
        </section>
      ))}
    </div>
  );
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());
  const sequenceRef = useRef(0);

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== id)
    );
  }, []);

  const notify = useCallback((type, message, duration = DEFAULT_DURATION) => {
    if (!message) return;

    const id = `notification-${Date.now()}-${sequenceRef.current++}`;
    setNotifications((currentNotifications) => [
      ...currentNotifications,
      { id, type, message },
    ]);

    const timer = setTimeout(() => dismiss(id), duration);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const value = useMemo(() => ({
    success: (message, duration) => notify("success", message, duration),
    error: (message, duration) => notify("error", message, duration),
    warning: (message, duration) => notify("warning", message, duration),
    info: (message, duration) => notify("info", message, duration),
    dismiss,
  }), [dismiss, notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationViewport notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}
