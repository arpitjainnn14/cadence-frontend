import { describe, expect, it } from "vitest";
import type { PaymentMethod } from "../api/types";
import { cardLook, cardName, paymentLabels } from "./cardStyle";

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

describe("drawn card text", () => {
  it("doesn't repeat the bank on the second line", () => {
    expect(cardName("HDFC", "HDFC Regalia")).toBe("Regalia");
    expect(cardName("hdfc", "HDFC Regalia")).toBe("Regalia");
    expect(cardName("slice", "slice")).toBe("");
    expect(cardName("IDFC FIRST", "Millennia")).toBe("Millennia");
    expect(cardName("Axis", "Axisphere")).toBe("Axisphere"); // only a whole-word prefix
    expect(cardName(null, "Some card")).toBe("");
  });

  it("is always drawn: no card art, whatever has_image says", () => {
    const look = cardLook({ ...pm("x", "ICICI Coral", "rupay"), bank: "ICICI", name: "Coral", has_image: true });
    expect(look).not.toHaveProperty("image");
    expect(look.bank).toBe("ICICI Bank");
    expect(look.name).toBe("Coral");
    expect(look.bg).toMatch(/gradient/);
  });
});
