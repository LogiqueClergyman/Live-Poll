// // src/providers/counter-store-provider.tsx
// "use client";

// import { type ReactNode, createContext, useRef, useContext } from "react";
// import { useStore } from "zustand";

// import {
//   type AuthStore,
//   createAuthStore,
//   initAuthStore,
// } from "./auth-store";

// export type AuthStoreApi = ReturnType<typeof createAuthStore>;

// export const AuthStoreContext = createContext<AuthStoreApi | undefined>(
//   undefined
// );

// export interface AuthStoreProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: AuthStoreProviderProps) => {
//   const storeRef = useRef<AuthStoreApi | undefined>(undefined);
//   if (!storeRef.current) {
//     storeRef.current = createAuthStore(initAuthStore());
//   }

//   return (
//     <AuthStoreContext.Provider value={storeRef.current}>
//       {children}
//     </AuthStoreContext.Provider>
//   );
// };

// export const useAuthStore = <T,>(
//   selector: (store: AuthStore) => T
// ): T => {
//   const counterStoreContext = useContext(AuthStoreContext);

//   if (!counterStoreContext) {
//     throw new Error(`useAuthStore must be used within AuthStoreProvider`);
//   }

//   return useStore(counterStoreContext, selector);
// };
