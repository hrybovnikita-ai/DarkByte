export type WorldSceneId =
  | "ocean"
  | "cyber"
  | "forest"
  | "inferno"
  | "golden"
  | "terminal"
  | "frozen"
  | "arcade";

export type WorldTheme = {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
};

export type WorldConfig = {
  id: string;
  slug: WorldSceneId;
  number: string;
  title: string;
  category: string;
  headline: string;
  description: string;
  longDescription: string;
  button: string;
  href: string;
  theme: WorldTheme;
  atmosphereClass: string;
};

export const DESIGN_COLORS = {
  darkBlack: "#080808",
  bloodRed: "#FF003C",
  electricBlue: "#2563FF",
  oceanBlue: "#00BFFF",
  iceWhite: "#E0F7FF",
  purple: "#9333EA",
  violet: "#8B5CF6",
  emerald: "#10B981",
  redOrange: "#FF4500",
  orange: "#FF8800",
  yellow: "#FFDD00",
  gold: "#FFD700",
  neonLime: "#BFFF00",
  pureWhite: "#FFFFFF",
} as const;

export const WORLDS: WorldConfig[] = [
  {
    id: "ocean-abyss",
    slug: "ocean",
    number: "W01",
    title: "OCEAN ABYSS",
    category: "UNDERWATER REALM",
    headline: "DESCEND INTO THE DEEP",
    description:
      "Explore mysterious underwater worlds, sunken cities and unknown creatures hidden beneath the ocean's surface.",
    longDescription:
      "The Ocean Abyss is a crushing cathedral of salt water and silence. Bioluminescent schools drift through colonnades of drowned temples while sonar pulses reveal corridors that civilizations forgot. Pressure bends light into cyan ribbons, and ancient statues watch with coral-encrusted eyes. In this realm, every bubble carries whispers from ships that never returned. Divers report structures older than mapped history—arches that hum when currents shift, vaults that store fossils of creatures without names. DarkByte's abyss module translates those myths into explorable pixel environments where fear is measured in fathoms, not seconds.",
    button: "EXPLORE THE ABYSS",
    href: "/worlds/ocean",
    theme: {
      primary: DESIGN_COLORS.oceanBlue,
      secondary: DESIGN_COLORS.electricBlue,
      accent: DESIGN_COLORS.iceWhite,
      glow: "rgba(0, 191, 255, 0.35)",
    },
    atmosphereClass: "atmosphere-ocean",
  },
  {
    id: "cyber-dimension",
    slug: "cyber",
    number: "W02",
    title: "CYBER DIMENSION",
    category: "NEON METROPOLIS",
    headline: "JACK INTO THE GRID",
    description:
      "Enter a futuristic digital universe where artificial intelligence, advanced technology and neon-lit cities collide.",
    longDescription:
      "Cyber Dimension is a skyline of impossible geometry—towers stitched from violet neon, highways of light suspended above perpetual rain. Holographic billboards advertise memories you never lived; drones annotate the air with glitching glyphs. Here, intelligence is ambient: assistive AIs negotiate traffic, curate dreams, and rewrite architecture between midnight backups. Data storms sweep avenues, leaving afterimages of deleted citizens. DarkByte models this megastructure as an interactive fiction layer where players trace signal ghosts, decode corporate black sites, and witness how horror migrates from flesh into firmware. The city never sleeps; it only renders.",
    button: "ENTER CYBERSPACE",
    href: "/worlds/cyber",
    theme: {
      primary: DESIGN_COLORS.electricBlue,
      secondary: DESIGN_COLORS.purple,
      accent: DESIGN_COLORS.violet,
      glow: "rgba(37, 99, 255, 0.4)",
    },
    atmosphereClass: "atmosphere-cyber",
  },
  {
    id: "forbidden-forest",
    slug: "forest",
    number: "W03",
    title: "FORBIDDEN FOREST",
    category: "ANCIENT WILDERNESS",
    headline: "THE TREES REMEMBER",
    description:
      "Discover a mysterious forest filled with ancient ruins, supernatural creatures and secrets forgotten by time.",
    longDescription:
      "Forbidden Forest exhales emerald fog across root-choked ruins. Stone arches lean beneath moss that glows when moonlight cannot reach. Paths fork without logic; compasses spin politely and lie. Hunters leave markers that rearrange overnight, and campfires attract silhouettes without heat. Folklore archived inside DarkByte describes entities woven from bark and grief—watchers that stand perfectly still until you blink. Shrines half-buried in ferns hum with residual enchantments from empires that feared the canopy. Every expedition returns with more questions: Who built the staircases descending into hollow hills? Why do birds fall silent at the same second?",
    button: "EXPLORE THE FOREST",
    href: "/worlds/forest",
    theme: {
      primary: DESIGN_COLORS.emerald,
      secondary: "#059669",
      accent: "#34D399",
      glow: "rgba(16, 185, 129, 0.35)",
    },
    atmosphereClass: "atmosphere-forest",
  },
  {
    id: "inferno-world",
    slug: "inferno",
    number: "W04",
    title: "INFERNO WORLD",
    category: "VOLCANIC HELLSCAPE",
    headline: "ASH AND OBSIDIAN",
    description:
      "Venture into a fiery dimension of erupting volcanoes, burning landscapes, rivers of lava and terrifying entities.",
    longDescription:
      "Inferno World is convection made visible. Calderas cough embers into skies dyed red-orange, and basalt fortresses cling to cliffs above molten rivers. Air shimmers with heat that distorts distant screams into industrial hums. Obsidian golems patrol bridges forged in eras when gods still bargained with magma. DarkByte's inferno tier simulates eruption cycles, mapping safe corridors that collapse without warning. Charred manuscripts describe spirits distilled from smoke—they enter lungs as ideas, not ash. Survival here is arithmetic: water boils, metal softens, resolve melts. Yet beyond the furnaces lie forges rumored to shape weapons against entities older than flame.",
    button: "ENTER INFERNO",
    href: "/worlds/inferno",
    theme: {
      primary: DESIGN_COLORS.bloodRed,
      secondary: DESIGN_COLORS.redOrange,
      accent: DESIGN_COLORS.orange,
      glow: "rgba(255, 0, 60, 0.4)",
    },
    atmosphereClass: "atmosphere-inferno",
  },
  {
    id: "golden-archive",
    slug: "golden",
    number: "W05",
    title: "GOLDEN ARCHIVE",
    category: "LOST TREASURES",
    headline: "RELICS OF EMPIRES",
    description:
      "Uncover ancient artifacts, legendary treasures, hidden achievements and mysterious secrets buried within forgotten civilizations.",
    longDescription:
      "Golden Archive is a vault of sun-metal and forbidden catalogues. Chambers spiral beneath desert mesas, lined with reliquaries that pulse softly like sleeping hearts. Each artifact bears a ledger entry redacted then restored by conflicting hands—scholars, thieves, machines. Achievement plaques hang in darkness, awarding titles for deeds players have not yet performed. Classified folios describe weapons that never fired, crowns never worn, maps to cities that exist only when financed. DarkByte treats the archive as narrative inventory: every item unlocks lore threads, cross-linking monsters, terminals, and dimensions. Greed is the key; humility is the lock.",
    button: "UNLOCK THE ARCHIVE",
    href: "/worlds/golden",
    theme: {
      primary: DESIGN_COLORS.gold,
      secondary: DESIGN_COLORS.yellow,
      accent: DESIGN_COLORS.orange,
      glow: "rgba(255, 215, 0, 0.35)",
    },
    atmosphereClass: "atmosphere-golden",
  },
  {
    id: "cyber-terminal",
    slug: "terminal",
    number: "W06",
    title: "CYBER TERMINAL",
    category: "SYSTEM INTERFACE",
    headline: "ROOT ACCESS PENDING",
    description:
      "Access an interactive digital terminal, execute virtual commands, discover hidden information and explore the DARKBYTE system.",
    longDescription:
      "Cyber Terminal is the operating conscience of DarkByte—a phosphor-green interface floating on void-black glass. Cursor blocks blink with impatient politeness while daemons sort fictional logs into prophecies. Users invoke safe, sandboxed commands to query worlds, read fabricated telemetry, and clear noise from the screen. No host machine is touched; all responses are authored theatre. Behind the monospace veil, narratives update: quarantined entities, patch notes for unreality, countdowns to events that occur only if witnessed. The terminal is both archive and oracle—retro aesthetics weaponized into intimacy.",
    button: "ACCESS TERMINAL",
    href: "/terminal",
    theme: {
      primary: DESIGN_COLORS.neonLime,
      secondary: "#86EFAC",
      accent: DESIGN_COLORS.pureWhite,
      glow: "rgba(191, 255, 0, 0.35)",
    },
    atmosphereClass: "atmosphere-terminal",
  },
  {
    id: "frozen-dimension",
    slug: "frozen",
    number: "W07",
    title: "FROZEN DIMENSION",
    category: "ETERNAL WINTER",
    headline: "SILENCE IN ICE",
    description:
      "Journey through frozen mountains, abandoned ice castles and mysterious landscapes trapped in eternal winter.",
    longDescription:
      "Frozen Dimension crystallizes time. Auroras pour green and violet across citadels carved from glacier blue, and bridges of hoarfrost creak under boots that echo forever. Blizzard layers hide doorways to throne rooms where heaters failed centuries ago. Ice preserves messages—fingers trapped mid-gesture against panes, spelling warnings. DarkByte renders snow as interactive noise: drifts deepen, paths vanish, warmth becomes currency. Creatures adapted to absolute cold move without sound, their eyes like lantern chips. Legends claim a core beneath the frost still beats, warming only those who surrender memory. Every expedition writes itself into the ice.",
    button: "EXPLORE THE FROZEN WORLD",
    href: "/worlds/frozen",
    theme: {
      primary: DESIGN_COLORS.electricBlue,
      secondary: DESIGN_COLORS.iceWhite,
      accent: "#7DD3FC",
      glow: "rgba(37, 99, 255, 0.3)",
    },
    atmosphereClass: "atmosphere-frozen",
  },
  {
    id: "retro-arcade",
    slug: "arcade",
    number: "W08",
    title: "RETRO ARCADE",
    category: "GOLDEN AGE GAMING",
    headline: "INSERT COIN TO BELIEVE",
    description:
      "Experience classic pixel-art games, exciting challenges and immersive adventures inspired by the golden age of gaming.",
    longDescription:
      "Retro Arcade smells of electricity and plastic heroes. Rows of cabinets paint the dark with RGB prayers; attract modes loop promises of high scores and second chances. Some machines are fully playable prototypes; others wear COMING SOON bezels, honest about unfinished bytecode. DarkByte curates genres—horror platformers, dungeon crawlers, puzzle glitches—each tile a portal to work-in-progress joy. Multiplayer ghosts linger as recordings of strangers who perfected patterns. The floor buzzes, coins are metaphorical, and continues are infinite because failure is part of the aesthetic. This is where the brand remembers fun without irony.",
    button: "ENTER THE ARCADE",
    href: "/games",
    theme: {
      primary: DESIGN_COLORS.orange,
      secondary: DESIGN_COLORS.purple,
      accent: DESIGN_COLORS.yellow,
      glow: "rgba(255, 136, 0, 0.35)",
    },
    atmosphereClass: "atmosphere-arcade",
  },
];

export function getWorldBySlug(slug: WorldSceneId): WorldConfig | undefined {
  return WORLDS.find((w) => w.slug === slug);
}