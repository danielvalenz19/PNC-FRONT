import { io, type Socket } from "socket.io-client"
import { API_CONFIG, AUTH_CONFIG } from "./config"

export interface SocketEvents {
  "incidents:new": (data: {
    id: string
    lat: number
    lng: number
    created_at: string
    status: "NEW"
  }) => void

  "incidents:update": (data: {
    id: string
    patch: {
      status?: string
      location?: { lat: number; lng: number }
      assignment?: any
      event?: any
    }
  }) => void

  "incident:update": (data: {
    id: string
    patch: {
      status?: string
      location?: { lat: number; lng: number }
      assignment?: any
      event?: any
    }
  }) => void

  "units:update": (data: {
    id: number
    status?: string
    lat?: number
    lng?: number
    last_seen?: string
  }) => void

  "geo:update": (data: any) => void
}

export class SocketManager {
  private static instance: SocketManager
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): void {
    if (typeof window === "undefined") return

    const accessToken = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)
    if (!accessToken) {
      console.log("[v0] No access token available for socket connection")
      return
    }

    if (this.socket?.connected) {
      this.socket.disconnect()
    }

    console.log("[v0] Connecting socket to:", API_CONFIG.WS_URL)

    this.socket = io(API_CONFIG.WS_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: {
        token: accessToken,
      },
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.socket.on("connect", () => {
      console.log("[v0] Socket connected successfully")
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[v0] Socket disconnected:", reason)
      if (reason === "io server disconnect") {
        this.handleReconnect()
      }
    })

    this.socket.on("connect_error", (error) => {
      console.error("[v0] Socket connection error:", error.message)

      if (error.message.includes("jwt") || error.message.includes("token") || error.message.includes("Auth")) {
        console.log("[v0] Token expired, need to refresh")
        this.disconnect()
        // Let the auth system handle token refresh
      } else {
        this.handleReconnect()
      }
    })
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`[v0] Reconnecting socket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, 1000 * this.reconnectAttempts)
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  subscribeToOps(callback?: (ack: { ok: boolean; error?: string }) => void): void {
    if (this.socket) {
      this.socket.emit("subscribe:ops", callback)
    }
  }

  subscribeToIncident(id: string, callback?: (ack: { ok: boolean; error?: string }) => void): void {
    if (this.socket) {
      this.socket.emit("subscribe:incident", { id }, callback)
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.socket?.on(event, callback)
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    this.socket?.off(event, callback)
  }

  emit(event: string, data?: any, callback?: (ack: any) => void): void {
    this.socket?.emit(event, data, callback)
  }

  updateAuth(accessToken: string): void {
    if (this.socket) {
      this.socket.auth = { token: accessToken }
      this.socket.disconnect().connect()
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const socketManager = SocketManager.getInstance()
