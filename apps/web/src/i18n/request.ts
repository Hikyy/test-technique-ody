import { defaultLocale } from "@ody/i18n";
import { fr } from "@ody/i18n/messages/fr";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages: fr,
    timeZone: "Europe/Paris",
  };
});
