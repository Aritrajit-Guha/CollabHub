import { io } from 'socket.io-client'
import { API_BASE } from './api.js'

export function createSocket(options = {}) {
  return io(API_BASE, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    ...options,
  })
}
