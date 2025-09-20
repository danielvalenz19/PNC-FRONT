"use client"

import { useEffect, useCallback, useRef } from "react"
import { socketManager, type SocketEvents } from "@/lib/socket"
import { useAuth } from "./use-auth"

export function useSocket() {
  const { isAuthenticated } = useAuth()
  const isConnectedRef = useRef(false)

  useEffect(() => {
    if (isAuthenticated && !isConnectedRef.current) {
      console.log("[v0] Connecting socket...")
      socketManager.connect()
      isConnectedRef.current = true
    } else if (!isAuthenticated && isConnectedRef.current) {
      console.log("[v0] Disconnecting socket...")
      socketManager.disconnect()
      isConnectedRef.current = false
    }

    return () => {
      if (isConnectedRef.current) {
        socketManager.disconnect()
        isConnectedRef.current = false
      }
    }
  }, [isAuthenticated])

  const subscribeToOps = useCallback(() => {
    socketManager.subscribeToOps((ack) => {
      console.log("[v0] Subscribed to ops:", ack)
    })
  }, [])

  const subscribeToIncident = useCallback((id: string) => {
    socketManager.subscribeToIncident(id, (ack) => {
      console.log(`[v0] Subscribed to incident ${id}:`, ack)
    })
  }, [])

  const on = useCallback(<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => {
    socketManager.on(event, callback)
  }, [])

  const off = useCallback(<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) => {
    socketManager.off(event, callback)
  }, [])

  const emit = useCallback((event: string, data?: any, callback?: (ack: any) => void) => {
    socketManager.emit(event, data, callback)
  }, [])

  const isConnected = useCallback(() => {
    return socketManager.isConnected()
  }, [])

  return {
    subscribeToOps,
    subscribeToIncident,
    on,
    off,
    emit,
    isConnected,
  }
}
