export type NotificationId = string & { readonly __brand: "NotificationId" };

export const toNotificationId = (raw: string): NotificationId => raw as NotificationId;
