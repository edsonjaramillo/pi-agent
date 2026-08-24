import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Return question numbers in the order they appear in an assistant response. */
export function extractQuestionNumbers(text: string): string[] {
  // Allow common Markdown formatting around the label. Do not require a literal
  // ASCII `-`: responses may use bold labels, another separator, or no separator.
  const questionPattern =
    /^[^\S\r\n]*(?:[-*+]\s+)?❓(?:\uFE0F)?[^\S\r\n]*(?:[*_`~]+[^\S\r\n]*)?Q[^\S\r\n]*(\d+)\b/gimu;

  return [...text.matchAll(questionPattern)].map((match) => match[1]);
}

export default function answersExtension(pi: ExtensionAPI): void {
  pi.registerCommand("answers", {
    description: "Prefill recommended answers for questions in the latest assistant response",
    handler: async (_args, ctx) => {
      const branch = ctx.sessionManager.getBranch();
      let latestAssistantText: string | undefined;

      for (let index = branch.length - 1; index >= 0; index -= 1) {
        const entry = branch[index];
        if (entry.type !== "message" || entry.message.role !== "assistant") continue;

        latestAssistantText = entry.message.content
          .filter((content) => content.type === "text")
          .map((content) => content.text)
          .join("\n");
        break;
      }

      if (latestAssistantText === undefined) {
        ctx.ui.notify("No previous assistant response found.", "warning");
        return;
      }

      const questionNumbers = extractQuestionNumbers(latestAssistantText);
      if (questionNumbers.length === 0) {
        ctx.ui.notify(
          "No matching ❓ Q<number> questions found in the latest assistant response.",
          "warning",
        );
        return;
      }

      ctx.ui.setEditorText(questionNumbers.map((number) => `Q${number}. 1`).join("\n"));
    },
  });
}
