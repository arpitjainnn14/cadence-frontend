import { describe, expect, it } from "vitest";
import type { PaymentMethod } from "../api/types";
import { paymentLabels } from "./cardStyle";

const pm = (id: string, display_name: string, network: PaymentMethod["network"]): PaymentMethod => ({
  id,
  type: "credit_card",
  bank: null,
  name: display_name,
  network,
  display_name,
  has_image: false,
  is_active: true,
  color: null,
});

describe("paymentLabels", () => {
  it("adds the network only when two methods share a display name", () => {
    const labels = paymentLabels([
      pm("a", "Scapia", "mastercard"),
      pm("b", "Scapia", "rupay"),
      pm("c", "HDFC Moneyback+", "visa"),
    ]);
    expect(labels.get("a")).toBe("Scapia · Mastercard");
    expect(labels.get("b")).toBe("Scapia · RuPay");
    expect(labels.get("c")).toBe("HDFC Moneyback+");
  });
});
