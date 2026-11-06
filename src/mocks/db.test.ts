import { expect, it } from "vitest";
import { displayName } from "./db";
it("builds display names the same way as the backend (its own test cases)", () => {
  expect(displayName("ICICI", "Amazon Pay ICICI")).toBe("Amazon Pay ICICI");
  expect(displayName("slice", "slice")).toBe("slice");
  expect(displayName("HDFC Bank", "MoneyBack+")).toBe("HDFC Bank MoneyBack+");
  expect(displayName("ICICI", "ICICIX Card")).toBe("ICICI ICICIX Card");
  expect(displayName("Scapia", "The scapia Federal")).toBe("The scapia Federal");
  expect(displayName(null, "GPay")).toBe("GPay");
});
