import { hc } from "hono/client";

import { AppType } from "../../api/routes";

export const client = hc<AppType>("http://localhost:3000");
