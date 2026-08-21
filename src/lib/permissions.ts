/**
 * Central Permissions & Role Access Control Module
 */

export interface DashboardPage {
  path: string;
  label: string;
  permissions: string[];
}

export const DASHBOARD_PAGES: DashboardPage[] = [
  { path: "/dashboard", label: "Overview", permissions: ["dashboard:view"] },
  { path: "/dashboard/users", label: "User Management", permissions: ["users:view", "users:edit"] },
  { path: "/dashboard/users/activities", label: "Activities Management", permissions: ["activities:view"] },
  { path: "/dashboard/users/transactions", label: "Transaction Management", permissions: ["transactions:view", "transactions:edit"] },
  { path: "/dashboard/blog", label: "Blog Management", permissions: ["blogs:view", "blogs:edit"] },
  { path: "/dashboard/library", label: "Library Management", permissions: ["library:view", "library:edit"] },
  { path: "/dashboard/assessments", label: "Financial Assessments", permissions: ["assessments:view", "assessments:edit"] },
  { path: "/dashboard/reports", label: "Reports & Analytics", permissions: ["reports:view"] },
  { path: "/dashboard/admin", label: "Admin Management", permissions: ["admins:view", "admins:edit"] },
  { path: "/dashboard/audit-logs", label: "System Audit Logs", permissions: ["audit:view"] },
  { path: "/dashboard/referrals", label: "Users Referrals", permissions: ["referrals:view"] },
  { path: "/dashboard/settings", label: "Account Settings", permissions: ["settings:view", "settings:edit"] },
  { path: "/dashboard/system-config", label: "System Configuration", permissions: ["system:config"] },
  { path: "/dashboard/support", label: "Support Centre", permissions: ["support:view"] },
  { path: "/dashboard/push-notifications", label: "Push Notifications", permissions: ["notifications:view", "notifications:edit"] },
  { path: "/dashboard/newsletter", label: "Newsletter Subscribers", permissions: ["newsletter:view"] },
];

export const PAGE_PERMISSIONS_MAP: Record<string, string[]> = DASHBOARD_PAGES.reduce((acc, item) => {
  acc[item.path] = item.permissions;
  return acc;
}, {} as Record<string, string[]>);

export const SIDEBAR_ROUTE_ORDER = DASHBOARD_PAGES.map(p => p.path);

/**
 * Derive semantic backend permission strings from UI page paths (1-to-1 mapping)
 */
export function deriveSemanticPermissions(pages: string[]): string[] {
  if (pages.includes("*")) return ["*"];
  return [...new Set(pages.flatMap(p => PAGE_PERMISSIONS_MAP[p] ?? []))];
}

/**
 * Reverse lookup: Map backend semantic permission strings to UI page paths (1-to-1)
 */
export function getPagePathsFromPermissions(permissions: string[]): string[] {
  if (!permissions || permissions.length === 0) return [];
  if (permissions.includes("*")) return ["*"];

  const hasSemanticStrings = permissions.some(p => p.includes(":"));

  if (!hasSemanticStrings) {
    // If permissions array already contains UI page paths
    return permissions.filter(p => DASHBOARD_PAGES.some(dp => dp.path === p));
  }

  return DASHBOARD_PAGES
    .filter(page => page.permissions.some(perm => permissions.includes(perm)))
    .map(page => page.path);
}

/**
 * Get active user permissions and allowed pages synchronously from user object or localStorage cache
 */
export function getCachedUserPermissions(): { role?: string; allowedPages: string[]; permissions: string[] } {
  if (typeof window === "undefined") {
    return { role: undefined, allowedPages: [], permissions: [] };
  }

  const role = localStorage.getItem("adminRole") || undefined;
  const storedAllowedPages = JSON.parse(localStorage.getItem("adminAllowedPages") || "[]");
  const storedPermissions = JSON.parse(localStorage.getItem("adminPermissions") || "[]");

  return {
    role,
    allowedPages: storedAllowedPages,
    permissions: storedPermissions,
  };
}

/**
 * Save user permissions cache synchronously on login or profile load
 */
export function syncUserPermissionsCache(user: any, token?: string) {
  if (typeof window === "undefined" || !user) return;

  let role = user.adminRole || user.role;
  let allowedPages: string[] = user.allowedPages || user.customRole?.allowedPages || user.teamMember?.allowedPages || [];
  let permissions: string[] = user.permissions || user.customRole?.permissions || user.teamMember?.customRole?.permissions || [];

  // If allowedPages or permissions are empty, attempt to decode from JWT
  const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (currentToken && (allowedPages.length === 0 || permissions.length === 0)) {
    try {
      const payload = JSON.parse(atob(currentToken.split(".")[1]));
      if (payload.adminRole) {
        role = payload.adminRole;
      } else if (!role && payload.role) {
        role = payload.role;
      }
      if (allowedPages.length === 0 && Array.isArray(payload.allowedPages)) {
        allowedPages = payload.allowedPages;
      }
      if (permissions.length === 0 && Array.isArray(payload.permissions)) {
        permissions = payload.permissions;
      }
      if (allowedPages.length === 0 && payload.customRole?.allowedPages) {
        allowedPages = payload.customRole.allowedPages;
      }
      if (permissions.length === 0 && payload.customRole?.permissions) {
        permissions = payload.customRole.permissions;
      }
      if (allowedPages.length === 0 && Array.isArray(payload.pages)) {
        allowedPages = payload.pages;
      }
    } catch (e) {}
  }

  // Only update localStorage if we have valid non-empty data
  if (role) localStorage.setItem("adminRole", role);
  if (allowedPages.length > 0) {
    localStorage.setItem("adminAllowedPages", JSON.stringify(allowedPages));
  }
  if (permissions.length > 0) {
    localStorage.setItem("adminPermissions", JSON.stringify(permissions));
  }
  localStorage.removeItem("deniedPaths");
}

/**
 * Synchronously checks if a pathname is allowed for a user
 */
export function checkRoutePermission(pathname: string, user?: any): boolean {
  // Always allowed system pages
  if (
    pathname === "/dashboard/settings" ||
    pathname === "/dashboard/notifications" ||
    pathname === "/dashboard/access-denied"
  ) {
    return true;
  }

  let role = user?.adminRole || user?.role;
  let allowedPages: string[] = user?.allowedPages || user?.customRole?.allowedPages || user?.teamMember?.allowedPages || [];
  let permissions: string[] = user?.permissions || user?.customRole?.permissions || user?.teamMember?.customRole?.permissions || [];

  // Fallback to synchronous cached values whenever user object does not have allowedPages
  if (allowedPages.length === 0 && permissions.length === 0) {
    const cached = getCachedUserPermissions();
    if (cached.role && !role) role = cached.role;
    if (cached.allowedPages.length > 0) allowedPages = cached.allowedPages;
    if (cached.permissions.length > 0) permissions = cached.permissions;
  }

  const normalizedRole = String(role || "").toUpperCase().replace(/[\s_-]/g, "");

  // Super Admin has unrestricted access to all pages
  if (normalizedRole === "SUPERADMIN" || normalizedRole === "SUPERADMINISTRATOR") return true;

  // Built-in full Admin without custom role restrictions has full access
  if (
    normalizedRole === "ADMIN" &&
    !user?.customRole &&
    !user?.customRoleId &&
    (!allowedPages || allowedPages.length === 0) &&
    (!permissions || permissions.length === 0)
  ) {
    return true;
  }

  if (allowedPages.includes("*") || permissions.includes("*")) return true;

  // Direct page path match or subroute match
  const isDirectlyAllowed = allowedPages.some((p) => {
    if (p === pathname) return true;
    if (p !== "/dashboard" && pathname.startsWith(p + "/")) return true;
    return false;
  });
  if (isDirectlyAllowed) return true;

  // Semantic permission check for current section
  const matchingSection = Object.keys(PAGE_PERMISSIONS_MAP).find((basePath) => {
    if (basePath === "/dashboard") return pathname === "/dashboard";
    return pathname === basePath || pathname.startsWith(basePath + "/");
  });

  if (matchingSection) {
    const requiredPerms = PAGE_PERMISSIONS_MAP[matchingSection] || [];
    if (requiredPerms.some((perm) => permissions.includes(perm))) return true;
    if (allowedPages.includes(matchingSection)) return true;
  }

  return false;
}

/**
 * Determines the very first allowed route for a user following exact sidebar order
 */
export function getFirstAllowedRoute(user?: any): string {
  // If Overview (/dashboard) is allowed, it is primary
  if (checkRoutePermission("/dashboard", user)) {
    return "/dashboard";
  }

  // Otherwise find first permitted route in exact sidebar order
  const found = SIDEBAR_ROUTE_ORDER.find((r) => r !== "/dashboard" && checkRoutePermission(r, user));
  return found || "/dashboard/settings";
}
