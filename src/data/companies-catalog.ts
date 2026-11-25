export type CompanyCatalogItem = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  website: string;
  description: string;
  category: string;
  accentColor: string;
  accentPalette: string[];
  integrationStatus: "INSPIRATION_ONLY";
};

export const COMPANIES_CATALOG: CompanyCatalogItem[] = [
  {
    id: "co-google",
    name: "Google",
    slug: "google",
    logo: "/brands/google.svg",
    website: "https://www.google.com/",
    description:
      "Search, cloud infrastructure, and consumer software that shaped the modern web.",
    category: "Search & Cloud",
    accentColor: "#4285F4",
    accentPalette: ["#4285F4", "#EA4335", "#FBBC05", "#34A853"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-apple",
    name: "Apple",
    slug: "apple",
    logo: "/brands/apple.svg",
    website: "https://www.apple.com/",
    description:
      "Hardware and software ecosystems focused on design, privacy, and creative tools.",
    category: "Consumer Technology",
    accentColor: "#F5F5F7",
    accentPalette: ["#F5F5F7", "#A1A1A6", "#E8E8ED"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-facebook",
    name: "Facebook",
    slug: "facebook",
    logo: "/brands/facebook.svg",
    website: "https://www.facebook.com/",
    description:
      "Social connectivity platform that influenced global communication patterns.",
    category: "Social",
    accentColor: "#1877F2",
    accentPalette: ["#1877F2", "#0A5FCC"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-amazon",
    name: "Amazon",
    slug: "amazon",
    logo: "/brands/amazon.svg",
    website: "https://www.amazon.com/",
    description:
      "E-commerce, logistics, and cloud services at planetary scale.",
    category: "Commerce & Cloud",
    accentColor: "#FF9900",
    accentPalette: ["#FF9900", "#232F3E"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-openai",
    name: "OpenAI",
    slug: "openai",
    logo: "/brands/openai.svg",
    website: "https://openai.com/",
    description:
      "Frontier AI research and products that advanced conversational intelligence.",
    category: "Artificial Intelligence",
    accentColor: "#FFFFFF",
    accentPalette: ["#FFFFFF", "#10A37F", "#000000"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-xai",
    name: "xAI",
    slug: "xai",
    logo: "/brands/xai.svg",
    website: "https://x.ai/",
    description:
      "AI company exploring large-scale models and reasoning systems.",
    category: "Artificial Intelligence",
    accentColor: "#FFFFFF",
    accentPalette: ["#FFFFFF", "#111111"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-netflix",
    name: "Netflix",
    slug: "netflix",
    logo: "/brands/netflix.svg",
    website: "https://www.netflix.com/",
    description:
      "Streaming entertainment pioneer reshaping how stories reach audiences.",
    category: "Digital Entertainment",
    accentColor: "#E50914",
    accentPalette: ["#E50914", "#B20710", "#000000"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-microsoft",
    name: "Microsoft",
    slug: "microsoft",
    logo: "/brands/microsoft.svg",
    website: "https://www.microsoft.com/",
    description:
      "Productivity software, gaming, and cloud platforms for creators and enterprises.",
    category: "Productivity & Cloud",
    accentColor: "#00A4EF",
    accentPalette: ["#F25022", "#7FBA00", "#00A4EF", "#FFB900"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-uber",
    name: "Uber",
    slug: "uber",
    logo: "/brands/uber.svg",
    website: "https://www.uber.com/",
    description:
      "Mobility and delivery networks powered by real-time logistics software.",
    category: "Mobility",
    accentColor: "#FFFFFF",
    accentPalette: ["#FFFFFF", "#000000", "#276EF1"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-nvidia",
    name: "NVIDIA",
    slug: "nvidia",
    logo: "/brands/nvidia.svg",
    website: "https://www.nvidia.com/",
    description:
      "GPU and accelerated computing hardware driving AI and interactive graphics.",
    category: "Hardware & AI",
    accentColor: "#76B900",
    accentPalette: ["#76B900", "#1A1A1A", "#000000"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-meta",
    name: "Meta",
    slug: "meta",
    logo: "/brands/meta.svg",
    website: "https://www.meta.com/",
    description:
      "Social technology and immersive experiences connecting billions of users.",
    category: "Social & Immersive",
    accentColor: "#0082FB",
    accentPalette: ["#0082FB", "#A7C7FF", "#0468D7"],
    integrationStatus: "INSPIRATION_ONLY",
  },
  {
    id: "co-anthropic",
    name: "Anthropic",
    slug: "anthropic",
    logo: "/brands/anthropic.svg",
    website: "https://www.anthropic.com/",
    description:
      "AI safety research and assistive models built for helpful, honest systems.",
    category: "Artificial Intelligence",
    accentColor: "#D97757",
    accentPalette: ["#D97757", "#F2E8DE", "#191919"],
    integrationStatus: "INSPIRATION_ONLY",
  },
];