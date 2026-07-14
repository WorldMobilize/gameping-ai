import { MAINTENANCE_MODE } from "@/lib/maintenance";
import { MAINTENANCE_HEADERS, maintenanceHtml } from "@/lib/maintenance-page";

/**
 * /maintenance — reachable directly, always.
 *
 * A Route Handler rather than a page because this needs to control its status code,
 * which an App Router page cannot do. Same markup the middleware serves; one source.
 *
 * The status tells the truth about the site, not about this URL: 503 while the site
 * is actually down (so crawlers hold their index and come back), plain 200 when it is
 * not — visiting /maintenance on a healthy site is just looking at a page.
 */
export function GET(): Response {
  return new Response(maintenanceHtml(), {
    status: MAINTENANCE_MODE ? 503 : 200,
    headers: MAINTENANCE_HEADERS,
  });
}
