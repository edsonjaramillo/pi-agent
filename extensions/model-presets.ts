import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

const MODEL_PROVIDER = "openai-codex";

const MODEL_PRESETS = {
  smart: {
    modelId: "gpt-6.1-sol",
    thinkingLevel: "high",
    description: "Use Sol with high thinking",
  },
  effecient: {
    modelId: "gpt-6-luna",
    thinkingLevel: "max",
    description: "Use Luna with maximum thinking",
  },
} as const;

type ModelPresetName = keyof typeof MODEL_PRESETS;
type ModelPreset = (typeof MODEL_PRESETS)[ModelPresetName];

const MODEL_PRESET_NAMES = Object.keys(MODEL_PRESETS) as ModelPresetName[];

async function applyModelPreset(
  pi: ExtensionAPI,
  preset: ModelPreset,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const model = ctx.modelRegistry.find(MODEL_PROVIDER, preset.modelId);
  if (!model) {
    ctx.ui.notify(`Model ${MODEL_PROVIDER}/${preset.modelId} is not available.`, "error");
    return;
  }

  const modelSelected = await pi.setModel(model);
  if (!modelSelected) {
    ctx.ui.notify(
      `Could not activate ${MODEL_PROVIDER}/${preset.modelId}. Check your API credentials.`,
      "error",
    );
    return;
  }

  pi.setThinkingLevel(preset.thinkingLevel);
}

export default function modelPresetsExtension(pi: ExtensionAPI): void {
  pi.registerCommand("mode", {
    description: "Switch between model presets",
    getArgumentCompletions: (argumentPrefix) =>
      MODEL_PRESET_NAMES.filter((name) => name.startsWith(argumentPrefix)).map((name) => ({
        label: name,
        value: name,
      })),
    handler: async (args, ctx) => {
      const mode = args.trim().split(/\s+/)[0] as ModelPresetName;
      const preset = MODEL_PRESETS[mode];

      if (!preset) {
        ctx.ui.notify(`Choose a mode: ${MODEL_PRESET_NAMES.join(", ")}.`, "warning");
        return;
      }

      await applyModelPreset(pi, preset, ctx);
    },
  });
}
