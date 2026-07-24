import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.json');

export interface Order {
  orderId: string;
  product: string;
  price: number;
  user: {
    email: string;
  };
  status: string;
  gatewayOrderId?: string;
  slottedAmount?: number;
  upiIntent?: string;
  lastFinalPrice?: number;
  couponCode?: string;
  discount?: number;
  originalPrice?: number;
  paymentVerified?: boolean;
  timestamp: number;
  clientConfig?: Record<string, any>;
  deliveryDetails?: string;
  utr?: string;
}

export interface DB {
  orders: Order[];
  users?: any[];
  settings?: {
    orderChannelId?: string;
    clearLogsChannelId?: string;
    coupons?: { code: string; discount: number; uses: number; maxUses: number }[];
    [key: string]: any;
  };
}

export function readDB(): DB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      const db = JSON.parse(data);
      if (!db.orders) db.orders = [];
      return db;
    }
  } catch (error) {
    console.error('Error reading DB:', error);
  }
  return { orders: [] };
}

export function writeDB(db: DB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

export function newOrderId(): string {
  return "AK" + Date.now().toString(36).toUpperCase();
}
