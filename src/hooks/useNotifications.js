import { useContext } from "react";
import { fallbackNotifications, NotificationContext } from "../contexts/NotificationContext";

export function useNotifications() {
  return useContext(NotificationContext) || fallbackNotifications;
}
