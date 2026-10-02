import type { Config } from "@react-router/dev/config";

export default {
  // No server anywhere: every route below is emitted as static HTML at build
  // time, so GitHub Pages serves deep links with a 200.
  ssr: false,
  prerender: ["/", "/kisk"],
} satisfies Config;
