

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  metadata?: {
    type: "transaction_confirmation";
    data: ParsedTransaction;
    isApproved?: boolean;
  };
}

export interface ParsedTransaction {
  description: string;
  amount: number;
  walletName: string;
  type: "expense" | "income";
  date: string; // YYYY-MM-DD
}
