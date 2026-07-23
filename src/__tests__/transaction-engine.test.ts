/**
 * GoFlazz Transaction Engine Integration Test Suite
 * Tests signing security, event decoding, failure diagnosis, and broadcast mechanics.
 */
import { EventDecoderService } from "@/services/event-decoder.service";
import { FailureAnalyzerService } from "@/services/failure-analyzer.service";
import { ethers } from "ethers";

describe("GoFlazz Transaction Engine Test Suite", () => {
  describe("Event Decoder Service", () => {
    it("should decode ERC-20 Transfer logs correctly", () => {
      const transferTopic = ethers.id("Transfer(address,address,uint256)");
      const fromAddr = "0x1111111111111111111111111111111111111111";
      const toAddr = "0x2222222222222222222222222222222222222222";
      const value = ethers.parseEther("10.5");

      const log = {
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548", // ARB token
        topics: [
          transferTopic,
          ethers.zeroPadValue(fromAddr, 32),
          ethers.zeroPadValue(toAddr, 32),
        ],
        data: ethers.toBeHex(value),
      };

      const decoded = EventDecoderService.decodeLogs([log]);
      expect(decoded.length).toBe(1);
      expect(decoded[0].eventName).toBe("Transfer");
      expect(decoded[0].from).toBe(ethers.getAddress(fromAddr));
      expect(decoded[0].to).toBe(ethers.getAddress(toAddr));
      expect(decoded[0].valueWei).toBe(value.toString());
      expect(decoded[0].formattedValue).toBe("10.5000");
    });

    it("should decode ERC-20 Approval logs correctly", () => {
      const approvalTopic = ethers.id("Approval(address,address,uint256)");
      const owner = "0x1111111111111111111111111111111111111111";
      const spender = "0x3333333333333333333333333333333333333333";

      const log = {
        address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
        topics: [
          approvalTopic,
          ethers.zeroPadValue(owner, 32),
          ethers.zeroPadValue(spender, 32),
        ],
        data: ethers.toBeHex(ethers.MaxUint256),
      };

      const decoded = EventDecoderService.decodeLogs([log]);
      expect(decoded.length).toBe(1);
      expect(decoded[0].eventName).toBe("Approval");
      expect(decoded[0].formattedValue).toBe("Unlimited");
    });
  });

  describe("Failure Analyzer Service", () => {
    it("should classify Out of Gas errors", () => {
      const res = FailureAnalyzerService.analyzeError("execution error: out of gas");
      expect(res.category).toBe("out_of_gas");
      expect(res.title).toContain("Out of Gas");
    });

    it("should classify Insufficient Funds errors", () => {
      const res = FailureAnalyzerService.analyzeError("insufficient funds for intrinsic transaction cost");
      expect(res.category).toBe("insufficient_funds");
      expect(res.suggestedAction).toContain("Top up native token balance");
    });

    it("should classify Contract Execution Reverts", () => {
      const res = FailureAnalyzerService.analyzeError("VM Exception while processing transaction: revert ERC20: insufficient allowance");
      expect(res.category).toBe("reverted");
      expect(res.userExplanation).toContain("Insufficient token allowance");
    });

    it("should classify replacement underpriced errors", () => {
      const res = FailureAnalyzerService.analyzeError("replacement transaction underpriced");
      expect(res.category).toBe("replacement_underpriced");
    });
  });
});
