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
    if (!order.raffleId) {
      console.error("Erro: raffleId ausente.");
      return { success: false, error: "ID da rifa ausente." };
    }

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, "pedidos", order.id);
      batch.update(orderRef, { status: "PAGO" });

      order.selectedNumbers.forEach((num) => {
        // Caminho PAR: rifas/{ID}/sold_numbers/{NUMERO}
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