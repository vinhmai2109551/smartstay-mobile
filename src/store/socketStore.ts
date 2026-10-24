import { Socket } from "socket.io-client";
import { create } from "zustand";

export const useSocketStore = create<{ socket: Socket | null }>(() => ({
  socket: null,
}));
