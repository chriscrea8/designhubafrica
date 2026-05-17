"use client";
import React, { useEffect, useState } from "react";
import { ShoppingBag, Package, Clock, CheckCircle2, Truck } from "lucide-react";
import { Card, CardContent, Badge, Button, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/orders").then(r => r.json()).then(res => {
      if (res.success) setOrders(res.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Orders</h1><p className="text-sm text-muted-foreground mt-1">Track your marketplace purchases</p></div>
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-12 w-12" />} title="No orders yet" description="Browse the marketplace to find amazing products" action={<Button variant="terracotta" asChild><Link href="/marketplace">Shop Now</Link></Button>} />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}><CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(order.createdAt)} • {order.items?.length || 0} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                  <Badge className={cn("text-[10px] mt-1 capitalize", getStatusColor(order.status))}>{order.status}</Badge>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
