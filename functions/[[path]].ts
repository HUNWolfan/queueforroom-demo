import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// @ts-ignore - This file is generated during the build
import * as build from "../build/server";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => ({ env: context.env }),
});
