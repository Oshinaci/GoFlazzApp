import { AddressFormatter } from "@/services/receive/addressFormatter";
import { QrGenerator } from "@/services/receive/qrGenerator";
import { ReceiveService } from "@/services/receive/receive.service";

describe("Receive Wallet Module Tests", () => {
  const testAddress = "0x7F2B3E19C82A4D12891938BC1982B1892837BC19";

  test("AddressFormatter shortens address correctly", () => {
    const shortened = AddressFormatter.shorten(testAddress, 6, 4);
    expect(shortened).toBe("0x7F2B...7BC19");
  });

  test("AddressFormatter validates EVM address correctly", () => {
    const valid = AddressFormatter.validateReceiveAddress(testAddress, "arbitrum");
    expect(valid.isValid).toBe(true);
    expect(valid.error).toBeUndefined();

    const invalid = AddressFormatter.validateReceiveAddress("0xinvalid", "arbitrum");
    expect(invalid.isValid).toBe(false);
    expect(invalid.error).toBeDefined();

    const empty = AddressFormatter.validateReceiveAddress("", "arbitrum");
    expect(empty.isValid).toBe(false);
  });

  test("QrGenerator creates EIP-681 URI correctly", () => {
    const uriWithAmount = QrGenerator.generateEip681Uri(testAddress, 42161, "0.5", "ETH");
    expect(uriWithAmount).toContain("ethereum:");
    expect(uriWithAmount).toContain("address=0x7F2B");
    expect(uriWithAmount).toContain("amount=0.5");
    expect(uriWithAmount).toContain("symbol=ETH");

    const uriWithoutAmount = QrGenerator.generateEip681Uri(testAddress, 42161);
    expect(uriWithoutAmount).toBe(testAddress);
  });

  test("ReceiveService returns supported networks with Arbitrum active", () => {
    const networks = ReceiveService.getSupportedNetworks();
    expect(networks.length).toBeGreaterThan(0);
    const arbitrum = networks.find((n) => n.id === "arbitrum");
    expect(arbitrum).toBeDefined();
    expect(arbitrum?.isActive).toBe(true);

    const ethereum = networks.find((n) => n.id === "ethereum");
    expect(ethereum).toBeDefined();
    expect(ethereum?.isActive).toBe(false);
  });
});
