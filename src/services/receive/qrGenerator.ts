import QRCode from "qrcode";

export class QrGenerator {
  /**
   * Generates EIP-681 Payment URI for Ethereum / EVM networks
   */
  static generateEip681Uri(address: string, chainId: number = 42161, amount?: string, symbol?: string): string {
    if (!amount || !symbol) {
      return address;
    }
    return `ethereum:${address}@${chainId}/transfer?address=${address}&amount=${amount}&symbol=${symbol}`;
  }

  /**
   * Generates QR Code Data URL (PNG/SVG base64)
   */
  static async generateDataUrl(text: string, width: number = 300): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
      return dataUrl;
    } catch (error) {
      console.error("[QrGenerator] Error generating QR code data URL:", error);
      throw error;
    }
  }

  /**
   * Generates QR Code SVG string
   */
  static async generateSvgString(text: string): Promise<string> {
    try {
      const svgString = await QRCode.toString(text, {
        type: "svg",
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
      return svgString;
    } catch (error) {
      console.error("[QrGenerator] Error generating QR SVG string:", error);
      throw error;
    }
  }
}
