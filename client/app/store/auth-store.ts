// // src/stores/counter-store.ts

import { UUID } from "crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
// import { UUID } from "crypto";
// import { createStore } from "zustand/vanilla";

// export type AuthState = {
//   userId: UUID | null;
//   username: string | null;
// };

// export type AuthActions = {
//   login: (userId: UUID, username: string) => void;
//   logout: () => void;
// };

// export type AuthStore = AuthState & AuthActions;

// export const initAuthStore = (): AuthState => {
//   return { userId: null, username: null };
// };

// export const defaultInitState: AuthState = {
//   userId: null,
//   username: null,
// };

// export const createAuthStore = (initState: AuthState = defaultInitState) => {
//   return createStore<AuthStore>()((set) => ({
//     ...initState,
//     login: (userId, username) => {
//       console.log("changing state to", userId, username);
//       set(() => ({ userId: userId, username: username }));
//     },
//     logout: () => set(() => ({ userId: null, username: null })),
//   }));
// };

export type AuthSession = {
  userId: UUID | null;
  username: string | null;
  createSession: (userId: UUID, username: string) => void;
  checkUserSession: (userId: UUID) => void;
  resetUserSession: () => void;
};

export const useAuthStore = create<AuthSession>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      createSession: (userId: UUID, username: string) => {
        console.log("changing state to", userId, username);
        set({ userId, username });
      },
      checkUserSession: (userId: UUID) => set({ userId }),
      resetUserSession: () => set({ userId: null, username: null }),
    }),
    {
      name: "user-info",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
