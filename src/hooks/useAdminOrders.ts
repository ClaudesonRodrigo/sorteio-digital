"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, writeBatch } from "firebase/firestore";

export interface Order {
  id: string;
  raffleId: string;
  raffleTitle: string;
  customerPhone: string;
  customerName: string;
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
    // Validação de Elite: Impede o erro de segmentos se o raffleId estiver ausente
    if (!order.raffleId) {
      console.error("Erro: O pedido não possui um raffleId associado.");
      return { success: false, error: "ID da rifa ausente no pedido." };
    }

    try {
      const batch = writeBatch(db);

      // 1. Atualiza o status do pedido para PAGO
      const orderRef = doc(db, "pedidos", order.id);
      batch.update(orderRef, { status: "PAGO" });

      // 2. Registra cada número na subcoleção 'sold_numbers' da rifa
      // Caminho correto: rifas/{ID}/sold_numbers/{NUMERO}
      order.selectedNumbers.forEach((num) => {
        const numberRef = doc(db, "rifas", order.raffleId, "sold_numbers", num);
        batch.set(numberRef, {
          number: num,
          buyerPhone: order.customerPhone,
          buyerName: order.customerName,
          orderId: order.id,
          paidAt: new Date()
        });
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Erro ao aprovar pedido:", error);
      return { success: false, error };
    }
  };

  return { orders, loading, approveOrder };
};