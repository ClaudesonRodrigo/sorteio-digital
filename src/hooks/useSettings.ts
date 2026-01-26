"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const useSettings = () => {
  // Inicializamos com strings vazias para evitar erros de componente controlado/não controlado
  const [settings, setSettings] = useState({
    pixKey: "",
    whatsapp: "",
    platformName: "Sorteio Digital"
  });

  useEffect(() => {
    // Escuta em tempo real o documento 'global' na coleção 'settings'
    const unsub = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          pixKey: data.pixKey || "",
          whatsapp: data.whatsapp || "",
          platformName: data.platformName || "Sorteio Digital"
        });
      }
    });

    return () => unsub();
  }, []);

  return settings;
};