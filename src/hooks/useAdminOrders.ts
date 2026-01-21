"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";

export interface Order {
  id: string;
  raffleId: string;
  raffleTitle: string;
  customerPhone: string;
  selectedNumbers: string[];
  totalValue: number;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  createdAt: any;
}

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), where("status", "==", "PENDENTE"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const approveOrder = async (order: Order) => {
    try {
      const batch = writeBatch(db);

      // 1. Atualiza o status do pedido para PAGO
      const orderRef = doc(db, "pedidos", order.id);
      batch.update(orderRef, { status: "PAGO" });

      // 2. Registra cada número na subcoleção 'sold_numbers' da rifa
      order.selectedNumbers.forEach((num) => {
        const numberRef = doc(db, "rifas", order.raffleId, "sold_numbers", num);
        batch.set(numberRef, {
          number: num,
          buyerPhone: order.customerPhone,
          orderId: order.id,
          paidAt: new Date()
        });
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Erro ao aprovar pedido:", error);
      return { success: false };
    }
  };

  return { orders, loading, approveOrder };
};