'use client';
import { createContext, useContext, useMemo, useState } from 'react';

const InitTextContext = createContext(null);

export function InitTextProvider({ children }) {
  const [initText, setInitText] = useState('');
  const [initAttachments, setInitAttachments] = useState([]);
  const [initMessageType, setInitMessageType] = useState('TEXT'); // ✅ new

  const value = useMemo(
    () => ({
      initText,
      setInitText,

      initAttachments,
      setInitAttachments,

      initMessageType,          // ✅ new
      setInitMessageType,       // ✅ new

      clear: () => {
        setInitText('');
        setInitAttachments([]);
        setInitMessageType('TEXT');
      },

      clearText: () => setInitText(''),
      clearAttachments: () => setInitAttachments([]),
      clearMessageType: () => setInitMessageType('TEXT'),

      append: (s) => setInitText((prev) => prev + s),
    }),
    [initText, initAttachments, initMessageType]
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
