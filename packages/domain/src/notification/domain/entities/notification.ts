import { type NotificationId, toNotificationId } from "../value-objects/notification-id.js";
import type { NotificationType } from "../value-objects/notification-type.js";

export interface NotificationProps {
  id: NotificationId;
  type: NotificationType;
  title: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export class Notification {
  private constructor(private readonly props: NotificationProps) {}

  static restore(props: NotificationProps): Notification {
    return new Notification(props);
  }

  static create(input: {
    id: string;
    type: NotificationType;
    title: string;
    data?: Record<string, unknown>;
    createdAt?: Date;
  }): Notification {
    return new Notification({
      id: toNotificationId(input.id),
      type: input.type,
      title: input.title,
      data: input.data ?? {},
      readAt: null,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  get id(): NotificationId {
    return this.props.id;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get data(): Record<string, unknown> {
    return this.props.data;
  }

  get readAt(): Date | null {
    return this.props.readAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isRead(): boolean {
    return this.props.readAt !== null;
  }

  markRead(at: Date = new Date()): Notification {
    if (this.props.readAt) return this;

    return new Notification({ ...this.props, readAt: at });
  }
}
