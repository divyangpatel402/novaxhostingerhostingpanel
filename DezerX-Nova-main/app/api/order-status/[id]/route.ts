import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendOrderReceivedEmail } from '@/lib/email';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const db = readDB();
  const o = db.orders.find(x => x.orderId === unwrappedParams.id);
  
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (o.status === "PENDING" && o.gatewayOrderId) {
    try {
      const settings = db.settings || {};
      const url = settings.gatewayUrl || process.env.GATEWAY_URL || "https://slice-upi-gateway.novaxsmp-upi.workers.dev";
      const secret = settings.gatewaySecret || process.env.GATEWAY_SECRET || "testsecret123";
      
      const gatewayRes = await fetch(`${url}/api/order/${o.gatewayOrderId}`, {
        headers: { 'Authorization': `Bearer ${secret}` }
      });
      const data = await gatewayRes.json();
      
      if (data.status === 'success' || data.status === 'SUCCESS' || data.status === 'PAID') {
        if (!o.paymentVerified) {
          o.paymentVerified = true;
          sendOrderReceivedEmail(o);
        }
        writeDB(db);
      } else if (data.status === 'timeout') {
        o.status = "REJECTED";
        writeDB(db);
      }
    } catch (err) {
      console.error("Polling gateway error:", err);
    }
  }

  return NextResponse.json({
    status: o.status,
    paymentVerified: o.paymentVerified,
    order: {
      orderId: o.orderId,
      product: o.product,
      price: o.price,
      timestamp: o.timestamp,
      utr: o.utr
    }
  });
}
