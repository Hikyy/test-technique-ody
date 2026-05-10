import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { registerCustomerRoutes } from "../routes/customers.js";
import { registerDashboardRoutes } from "../routes/dashboard.js";
import { registerIdentityRoutes } from "../routes/identity.js";
import { registerInvitationRoutes } from "../routes/invitations.js";
import { registerMenuRoutes } from "../routes/menu.js";
import { registerNotificationRoutes } from "../routes/notifications.js";
import { registerOnboardingRoutes } from "../routes/onboarding.js";
import { registerOrderRoutes } from "../routes/orders.js";
import { registerOrganizationRoutes } from "../routes/organizations.js";
import { registerReservationRoutes } from "../routes/reservations.js";
import { registerSettingsRoutes } from "../routes/settings.js";
import { registerTableRoutes } from "../routes/tables.js";
import { registerUploadsRoutes } from "../routes/uploads.js";
import { registerNotificationListeners } from "./notification/infrastructure/listener.js";

export function mountAllModules(app: Hono<AppEnv>): void {
  registerIdentityRoutes(app);
  registerCustomerRoutes(app);
  registerOrderRoutes(app);
  registerMenuRoutes(app);
  registerSettingsRoutes(app);
  registerDashboardRoutes(app);
  registerNotificationRoutes(app);
  registerInvitationRoutes(app);
  registerOnboardingRoutes(app);
  registerOrganizationRoutes(app);
  registerTableRoutes(app);
  registerReservationRoutes(app);
  registerUploadsRoutes(app);

  registerNotificationListeners();
}
