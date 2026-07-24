import { toast } from "sonner";

export class ShareService {
  /**
   * Copies text to clipboard with optional success toast & haptic feedback
   */
  static async copyToClipboard(text: string, successMessage: string = "Address copied to clipboard!"): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      // Trigger haptic vibration if supported
      if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
        window.navigator.vibrate(40);
      }

      toast.success(successMessage);
      return true;
    } catch (error) {
      console.error("[ShareService] Copy error:", error);
      toast.error("Failed to copy to clipboard.");
      return false;
    }
  }

  /**
   * Triggers native Web Share API if available
   */
  static async nativeShare(title: string, text: string, url?: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: url || window.location.href,
        });
        toast.success("Shared successfully!");
        return true;
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("[ShareService] Native share error:", error);
        }
        return false;
      }
    } else {
      // Fallback to clipboard copy
      return ShareService.copyToClipboard(text, "Address copied for sharing!");
    }
  }
}
