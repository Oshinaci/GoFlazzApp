import jsPDF from "jspdf";

/**
 * Generates a clean, printable PDF document containing the user's secret recovery mnemonic.
 * Uses client-side Blob generation for maximum privacy and offline security.
 */
export function generateMnemonicPDF(walletName: string, walletAddress: string, mnemonic: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header Background Box
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, 210, 42, "F");

  // App Title & Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("GoFlazz Self-Custody Wallet", 20, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // #cbd5e1
  doc.text("Confidential Mnemonic Recovery Backup Sheet", 20, 29);

  // Security Notice Box
  doc.setFillColor(254, 242, 242); // #fef2f2
  doc.setDrawColor(239, 68, 68); // #ef4444
  doc.setLineWidth(0.5);
  doc.rect(20, 50, 170, 30, "FD");

  doc.setTextColor(185, 28, 28); // #b91c1c
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("CRITICAL SECURITY NOTICE:", 25, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(127, 29, 29);
  doc.text(
    "1. Keep this paper copy stored in a secure, confidential place (e.g., safe/vault).",
    25,
    66
  );
  doc.text(
    "2. Never share these 12 words with anyone. GoFlazz staff will NEVER ask for them.",
    25,
    73
  );

  // Account Information Details
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.rect(20, 88, 170, 28, "FD");

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Wallet Label:", 25, 97);
  doc.setFont("helvetica", "normal");
  doc.text(walletName || "Primary Wallet", 60, 97);

  doc.setFont("helvetica", "bold");
  doc.text("Public Address:", 25, 107);
  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.text(walletAddress, 60, 107);

  // Mnemonic 12-Word Container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(59, 130, 246); // #3b82f6
  doc.setLineWidth(0.7);
  doc.rect(20, 124, 170, 72, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("12-Word Secret Recovery Mnemonic", 25, 133);

  const words = mnemonic.trim().split(/\s+/);

  doc.setFont("courier", "bold");
  doc.setFontSize(10.5);

  words.forEach((word, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 27 + col * 55;
    const y = 146 + row * 12;

    // Word pill box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(x - 2, y - 6, 50, 8.5, "FD");

    doc.setTextColor(15, 23, 42);
    doc.text(`${(index + 1).toString().padStart(2, "0")}. ${word}`, x, y);
  });

  // Footer & Timestamp
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated locally on: ${timestamp} | Client-side zero-knowledge PDF export`, 20, 208);
  doc.text("GoFlazz Wallet — Self-Custodial Encrypted Vault", 20, 213);

  // Client-side Blob creation and download trigger
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);

  const downloadLink = document.createElement("a");
  downloadLink.href = blobUrl;
  const safeName = (walletName || "Wallet").replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadLink.download = `GoFlazz-Backup-${safeName}.pdf`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}
