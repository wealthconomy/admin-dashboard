// Central dashboard permission mappings and helpers

export const PAGE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard":                      ["dashboard:view"],
  "/dashboard/users":                ["users:view", "users:edit"],
  "/dashboard/users/activities":     ["activities:view"],
  "/dashboard/users/transactions":   ["transactions:view", "transactions:edit"],
  "/dashboard/blog":                 ["blogs:view", "blogs:edit"],
  "/dashboard/library":              ["library:view", "library:edit"],
  "/dashboard/assessments":          ["assessments:view", "assessments:edit", "dashboard:view"],
  "/dashboard/reports":              ["dashboard:view", "reports:view"],
  "/dashboard/admin":                ["dashboard:view", "admins:view", "admins:edit"],
  "/dashboard/audit-logs":           ["audit:view"],
  "/dashboard/referrals":            ["users:view", "referrals:view"],
  "/dashboard/settings":             ["settings:view", "settings:edit"],
  "/dashboard/system-config":        ["settings:view", "settings:edit", "system:config"],
  "/dashboard/support":              ["users:view", "support:view"],
  "/dashboard/push-notifications":   ["notifications:view", "notifications:edit"],
  "/dashboard/newsletter":           ["newsletter:view", "notifications:view", "dashboard:view"],
};

export const SIDEBAR_ROUTE_ORDER = [
  "/dashboard",
  "/dashboard/users",
  "/dashboard/users/activities",
  "/dashboard/users/transactions",
  "/dashboard/blog",
  "/dashboard/library",
  "/dashboard/assessments",
  "/dashboard/support",
  "/dashboard/referrals",
  "/dashboard/push-notifications",
  "/dashboard/reports",
  "/dashboard/newsletter",
  "/dashboard/admin",
  "/dashboard/audit-logs",
  "/dashboard/system-config",
  "/dashboard/settings",
];

export function checkRoutePermission(pathname: string, user: any): boolean {
  if (!user || Object.keys(user).length === 0) return true;

  const role = user.role || user.adminRole;
  if (role === "SUPER_ADMIN" || role === "super_admin") return true;

  // Account Settings, Notifications, and Access Denied are always allowed for all admins
  if (
    pathname === "/dashboard/settings" ||
    pathname === "/dashboard/notifications" ||
    pathname === "/dashboard/access-denied"
  ) {
    return true;
  }

  const allowedPages: string[] = user.allowedPages || user.customRole?.allowedPages || [];
  const permissions: string[] = user.permissions || user.customRole?.permissions || [];

  if (allowedPages.includes("*") || permissions.includes("*")) {
    return true;
  }

  // Check direct page paths or subroutes
  const isExplicitlyAllowed = allowedPages.some((p) => {
    if (p === pathname) return true;
    if (p !== "/dashboard" && pathname.startsWith(p)) return true;
    return false;
  });
  if (isExplicitlyAllowed) return true;

  // Check semantic permissions against the base section
  const matchingSection = Object.keys(PAGE_PERMISSIONS).find((basePath) => {
    if (basePath === "/dashboard") return pathname === "/dashboard";
    return pathname === basePath || pathname.startsWith(basePath + "/");
  });

  if (matchingSection) {
    const requiredPerms = PAGE_PERMISSIONS[matchingSection] || [];
    if (requiredPerms.some((perm) => permissions.includes(perm))) return true;
    if (allowedPages.includes(matchingSection)) return true;
  }

  // If standard ADMIN with no custom restrictions, allow
  if (role === "ADMIN" && !user.customRole && allowedPages.length === 0 && permissions.length === 0) {
    return true;
  }

  // If user has no custom restrictions configured, allow
  if (!user.customRole && allowedPages.length === 0 && permissions.length === 0) {
    return true;
  }

  return false;
}

export function getFirstAllowedRoute(user: any): string {
  if (!user) return "/dashboard";

  // If user has access to Overview (/dashboard), it is the primary landing page
  if (checkRoutePermission("/dashboard", user)) {
    return "/dashboard";
  }

  // Otherwise, traverse in exact sidebar order to find the first allowed page
  const found = SIDEBAR_ROUTE_ORDER.find((r) => r !== "/dashboard" && checkRoutePermission(r, user));
  return found || "/dashboard/settings";
}
