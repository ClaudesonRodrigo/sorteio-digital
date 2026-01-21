"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Stack de Elite
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Raffle } from "@/schemas/raffle";

export const useRaffles = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usando a coleção 'rifas' conforme nossas regras de segurança
    const q = query(collection(db, "rifas"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Garantindo que a drawDate seja tratada corretamente
        drawDate: doc.data().drawDate
      })) as Raffle[]; // Cast para a interface que já possui o campo 'type'
      
      setRaffles(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar rifas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { raffles, loading };
};