"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    activeRaffles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Monitorar pedidos pagos
    const qPaid = query(collection(db, "pedidos"), where("status", "==", "PAGO"));
    const unsubPaid = onSnapshot(qPaid, (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().totalValue || 0), 0);
      setStats(prev => ({ ...prev, totalSales: total }));
    }, (err) => console.error("Erro Pedidos Pagos:", err.message));

    // 2. Monitorar pedidos pendentes
    const qPending = query(collection(db, "pedidos"), where("status", "==", "PENDENTE"));
    const unsubPending = onSnapshot(qPending, (snap) => {
      setStats(prev => ({ ...prev, pendingOrders: snap.size }));
    }, (err) => console.error("Erro Pedidos Pendentes:", err.message));

    // 3. Monitorar rifas abertas (Usa a coleção 'rifas' conforme regras)
    const qRaffles = query(collection(db, "rifas"), where("status", "==", "OPEN"));
    const unsubRaffles = onSnapshot(qRaffles, (snap) => {
      setStats(prev => ({ ...prev, activeRaffles: snap.size }));
      setLoading(false);
    }, (err) => console.error("Erro Rifas Ativas:", err.message));

    return () => {
      unsubPaid();
      unsubPending();
      unsubRaffles();
    };
  }, []);

  return { stats, loading };
};