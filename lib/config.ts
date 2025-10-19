export const API_CONFIG = {
  // Allow overriding via NEXT_PUBLIC_* env vars. When not set, default to localhost:4000 for local dev.
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000",
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000",
  // Keep explicit fallbacks for other tools that might inspect them
  FALLBACK_BASE_URL: "http://localhost:4000",
  FALLBACK_WS_URL: "http://localhost:4000",
} as const

export const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: "pnc_access_token",
  REFRESH_TOKEN_KEY: "pnc_refresh_token",
  USER_ROLE_KEY: "pnc_user_role",
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const

export type UserRole = "admin" | "operator" | "supervisor" | "unit"

export type IncidentStatus = "NEW" | "ACK" | "DISPATCHED" | "IN_PROGRESS" | "CANCELED" | "CLOSED"

export type UnitStatus = "AVAILABLE" | "BUSY" | "OFFLINE" | "MAINTENANCE"

export type UnitType = "patrol" | "moto" | "ambulance"

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/v1/auth/login",
  REFRESH: "/api/v1/auth/refresh",
  LOGOUT: "/api/v1/auth/logout",
  CHANGE_PASSWORD: "/api/v1/auth/change-password",
  ME: "/api/v1/me",

  // Ops (operator, supervisor, admin)
  OPS_INCIDENTS: "/api/v1/ops/incidents",
  OPS_INCIDENT_DETAIL: (id: string) => `/api/v1/ops/incidents/${id}`,
  OPS_INCIDENT_ACK: (id: string) => `/api/v1/ops/incidents/${id}/ack`,
  OPS_INCIDENT_ASSIGN: (id: string) => `/api/v1/ops/incidents/${id}/assign`,
  OPS_INCIDENT_STATUS: (id: string) => `/api/v1/ops/incidents/${id}/status`,
  OPS_INCIDENT_NOTES: (id: string) => `/api/v1/ops/incidents/${id}/notes`,
  OPS_UNITS: "/api/v1/ops/units",
  OPS_UNIT_DETAIL: (id: string) => `/api/v1/ops/units/${id}`,
  OPS_REPORTS_KPIS: "/api/v1/ops/reports/kpis",
  OPS_SETTINGS: "/api/v1/ops/settings",
  OPS_AUDIT: "/api/v1/ops/audit",

  // Admin (admin only)
  ADMIN_USERS: "/api/v1/admin/users",
  ADMIN_CREATE_USER: "/api/v1/admin/users",
  ADMIN_USER_DETAIL: (id: number | string) => `/api/v1/admin/users/${id}`,
  ADMIN_RESET_PASSWORD: (id: number) => `/api/v1/admin/users/${id}/reset-password`,
  ADMIN_UPDATE_STATUS: (id: number) => `/api/v1/admin/users/${id}/status`,
  ADMIN_USERS_STATS: "/api/v1/admin/users/stats",

  // Simulations
  SIMULATIONS: "/api/v1/simulations",
  SIMULATION_STATUS: (id: string) => `/api/v1/simulations/${id}/status`,
} as const

export const REQUEST_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
  Accept: "application/json",
} as const
