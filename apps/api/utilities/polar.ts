import { Polar } from "@polar-sh/sdk";
import { CONFIG } from "./config";

export const polar = new Polar({
  server: 'sandbox',
  accessToken: CONFIG.polarAccessToken,
})