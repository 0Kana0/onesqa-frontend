'use client';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const InitTextContext = createContext(null);

export function InitTextProvider({ children }) {
  const [initText, setInitText] = useState('');

  // (ตัวเลือก) ให้ค้างหลัง refresh
  // useEffect(() => {
  //   const saved = localStorage.getItem('shared:initText');
  //   if (saved !== null) setInitText(saved);
  // }, []);
  // useEffect(() => {
  //   localStorage.setItem('shared:initText', initText);
  // }, [initText]);

  const value = useMemo(
    () => ({
      initText,
      setInitText,
      clear: () => setInitText(''),
      append: (s) => setInitText((prev) => prev + s),
    }),
    [initText]
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
