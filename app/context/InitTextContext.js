'use client';
import { createContext, useContext, useMemo, useState } from 'react';

const InitTextContext = createContext(null);

export function InitTextProvider({ children }) {
  const [initText, setInitText] = useState('');
  const [initAttachments, setInitAttachments] = useState([]); // 👈 new

  const value = useMemo(
    () => ({
      initText,
      setInitText,
      initAttachments,          // 👈 new
      setInitAttachments,       // 👈 new
      clear: () => setInitText(''),
      append: (s) => setInitText((prev) => prev + s),
    }),
    [initText, initAttachments] // 👈 include attachments in deps
  );

  return (
    <InitTextContext.Provider value={value}>
      {children}
    </InitTextContext.Provider>
  );
}

export function useInitText() {
  const ctx = useContext(InitTextContext);
  if (!ctx) throw new Error('useInitText ต้องใช้ภายใน <InitTextProvider>');
  return ctx;
}
