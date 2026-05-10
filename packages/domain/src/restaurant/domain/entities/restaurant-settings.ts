/**
 * RestaurantSettings — singleton aggregate (one row).
 */

import type { Email } from "../../../shared-kernel/email.js";
import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import type { PhoneNumber } from "../../../shared-kernel/phone-number.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { OpeningHours } from "../value-objects/opening-hours.js";

export const SETTINGS_SINGLETON_ID = "restaurant-settings" as const;
// Identity is now the restaurant's UUID (multi-tenant). Kept named SettingsId
// for back-compat with consumer code; the legacy literal id is no longer used.
export type SettingsId = string;

export interface RestaurantSettingsProps {
  id: SettingsId;
  name: string;
  address: string;
  phone: PhoneNumber | null;
  contactEmail: Email | null;
  openingHours: OpeningHours;
  notificationsEnabled: boolean;
  updatedAt: Date;
}

export interface UpdateSettingsPatch {
  name?: string;
  address?: string;
  phone?: PhoneNumber | null;
  contactEmail?: Email | null;
  openingHours?: OpeningHours;
  notificationsEnabled?: boolean;
}

export class RestaurantSettings {
  private constructor(private props: RestaurantSettingsProps) {}

  static create(input: {
    id: SettingsId;
    name: string;
    address: string;
    phone?: PhoneNumber | null;
    contactEmail?: Email | null;
    openingHours: OpeningHours;
    notificationsEnabled?: boolean;
    updatedAt?: Date;
  }): Result<RestaurantSettings, DomainError> {
    const name = input.name.trim();
    if (name.length < 1 || name.length > 120) {
      return Err(new ValidationError("Settings.name length must be 1..120"));
    }
    const address = input.address.trim();
    if (address.length < 1 || address.length > 240) {
      return Err(new ValidationError("Settings.address length must be 1..240"));
    }
    return Ok(
      new RestaurantSettings({
        id: input.id,
        name,
        address,
        phone: input.phone ?? null,
        contactEmail: input.contactEmail ?? null,
        openingHours: input.openingHours,
        notificationsEnabled: input.notificationsEnabled ?? true,
        updatedAt: input.updatedAt ?? new Date(),
      }),
    );
  }

  static restore(props: RestaurantSettingsProps): RestaurantSettings {
    return new RestaurantSettings(props);
  }

  get id(): SettingsId {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get address(): string {
    return this.props.address;
  }
  get phone(): PhoneNumber | null {
    return this.props.phone;
  }
  get contactEmail(): Email | null {
    return this.props.contactEmail;
  }
  get openingHours(): OpeningHours {
    return this.props.openingHours;
  }
  get notificationsEnabled(): boolean {
    return this.props.notificationsEnabled;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(patch: UpdateSettingsPatch, at: Date = new Date()): Result<void, DomainError> {
    const next = { ...this.props, updatedAt: at };
    if (patch.name !== undefined) {
      const t = patch.name.trim();
      if (t.length < 1 || t.length > 120) {
        return Err(new ValidationError("Settings.name length must be 1..120"));
      }
      next.name = t;
    }
    if (patch.address !== undefined) {
      const t = patch.address.trim();
      if (t.length < 1 || t.length > 240) {
        return Err(new ValidationError("Settings.address length must be 1..240"));
      }
      next.address = t;
    }
    if (patch.phone !== undefined) next.phone = patch.phone;
    if (patch.contactEmail !== undefined) next.contactEmail = patch.contactEmail;
    if (patch.openingHours !== undefined) next.openingHours = patch.openingHours;
    if (patch.notificationsEnabled !== undefined) {
      next.notificationsEnabled = patch.notificationsEnabled;
    }
    this.props = next;
    return Ok(undefined);
  }
}
