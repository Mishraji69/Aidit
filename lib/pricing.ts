import { PricingTable } from "./types";

export const PRICING: PricingTable = {
  chatgpt: {
    toolName: "ChatGPT",
    category: "assistant",
    usageTypes: ["subscription"],
    plans: {
      free: { label: "Free", priceMonthly: 0, perSeat: false },
      plus: { label: "Plus", priceMonthly: 20, perSeat: false },
      team: { label: "Team", priceMonthly: 30, perSeat: true },
      enterprise: { label: "Enterprise", priceMonthly: 60, perSeat: true },
    },
  },
  claude: {
    toolName: "Claude",
    category: "assistant",
    usageTypes: ["subscription"],
    plans: {
      pro: { label: "Pro", priceMonthly: 20, perSeat: false },
      team: { label: "Team", priceMonthly: 30, perSeat: true },
      enterprise: { label: "Enterprise", priceMonthly: 60, perSeat: true },
    },
  },
  copilot: {
    toolName: "GitHub Copilot",
    category: "coding",
    usageTypes: ["subscription"],
    plans: {
      individual: { label: "Individual", priceMonthly: 10, perSeat: false },
      business: { label: "Business", priceMonthly: 19, perSeat: true },
      enterprise: { label: "Enterprise", priceMonthly: 39, perSeat: true },
    },
  },
  cursor: {
    toolName: "Cursor",
    category: "coding",
    usageTypes: ["subscription"],
    plans: {
      pro: { label: "Pro", priceMonthly: 20, perSeat: true },
      business: { label: "Business", priceMonthly: 40, perSeat: true },
    },
  },
  gemini: {
    toolName: "Gemini",
    category: "research",
    usageTypes: ["subscription"],
    plans: {
      advanced: { label: "Advanced", priceMonthly: 20, perSeat: false },
      team: { label: "Team", priceMonthly: 30, perSeat: true },
    },
  },
  perplexity: {
    toolName: "Perplexity",
    category: "research",
    usageTypes: ["subscription"],
    plans: {
      pro: { label: "Pro", priceMonthly: 20, perSeat: false },
      enterprise: { label: "Enterprise", priceMonthly: 40, perSeat: true },
    },
  },
  openai_api: {
    toolName: "OpenAI API",
    category: "platform",
    usageTypes: ["api"],
    plans: {},
    api: { pricePerMillionTokens: 0 },
  },
  anthropic_api: {
    toolName: "Anthropic API",
    category: "platform",
    usageTypes: ["api"],
    plans: {},
    api: { pricePerMillionTokens: 0 },
  },
};
