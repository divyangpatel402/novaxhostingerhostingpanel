import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendOrderReceivedEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (secret && secret !== (process.env.GATEWAY_SECRET || "testsecret123")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { event, order } = body;

    if (event === "order.success" && order) {
      const db = readDB();
      const matchingOrder = db.orders.find(o => 
        o.gatewayOrderId === order.order_id || 
        (o.status === "PENDING" && o.slottedAmount === order.amount)
      );
      
      if (matchingOrder) {
        matchingOrder.paymentVerified = true;
        matchingOrder.status = "APPROVED"; // Change to APPROVED for now so user can see success
        sendOrderReceivedEmail(matchingOrder);
        writeDB(db);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
