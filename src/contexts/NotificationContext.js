import { createContext } from "react";

export const NotificationContext = createContext(null);

export const fallbackNotifications = {
  success: () => undefined,
  error: () => undefined,
  warning: () => undefined,
  info: () => undefined,
  dismiss: () => undefined,
};
