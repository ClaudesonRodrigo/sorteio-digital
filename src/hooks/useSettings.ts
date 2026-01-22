"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const useSettings = () => {
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        setPixKey(doc.data().pixKey);
      }
    });
    return () => unsub();
  }, []);

  return { pixKey };
};