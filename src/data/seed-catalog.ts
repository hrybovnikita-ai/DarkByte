export const SEED_MONSTERS = [
  {
    externalId: "DBX-001",
    name: "Static Wraith",
    threat: "CLASS-III",
    description:
      "A humanoid silhouette composed of corrupted video artifacts. Detected only on legacy CRT feeds.",
    icon: "SW",
  },
  {
    externalId: "DBX-014",
    name: "Null Maw",
    threat: "CLASS-V",
    description:
      "An absence-shaped predator that consumes process memory. Leaves encrypted teeth marks in log files.",
    icon: "NM",
  },
  {
    externalId: "DBX-027",
    name: "Pixel Seraph",
    threat: "CLASS-II",
    description:
      "Glitching angel entity trapped between sprite layers. Harmless unless rendered at native resolution.",
    icon: "PS",
  },
  {
    externalId: "DBX-039",
    name: "Root Crawler",
    threat: "CLASS-IV",
    description:
      "Burrows through filesystem trees underground. Whispers update prompts at 3 AM.",
    icon: "RC",
  },
  {
    externalId: "DBX-052",
    name: "Echo Stalker",
    threat: "CLASS-III",
    description:
      "Mimics user keystrokes with a one-second delay. Never caught on microphone recordings.",
    icon: "ES",
  },
  {
    externalId: "DBX-061",
    name: "Crimson Kernel",
    threat: "CLASS-VI",
    description:
      "Firmware-level horror. Reboots the machine into a dimension with inverted color channels.",
    icon: "CK",
  },
];

export const SEED_STORIES = [
  {
    slug: "signal-in-the-abyss",
    title: "Signal in the Abyss",
    summary: "A sonar ping returns a voice speaking a dead language.",
    body: "Expedition logs describe coordinates that should be solid rock. Instead, the ping maps a corridor. Every replay adds another syllable to the chorus.",
  },
  {
    slug: "neon-confession",
    title: "Neon Confession",
    summary: "A billboard confesses to murders that never happened.",
    body: "Cyber Dimension residents assume the text is viral marketing until timestamps align with their own deleted memories.",
  },
];

export const SEED_GAMES = [
  {
    slug: "pixel-descent",
    title: "Pixel Descent",
    genre: "Horror Platformer",
    description: "Descend procedural ruins. Not playable yet.",
    playable: false,
  },
  {
    slug: "neon-maze",
    title: "Neon Maze",
    genre: "Cyber Puzzle",
    description: "Route packets through hostile grids. Prototype in progress.",
    playable: false,
  },
];

export const SEED_SECRET_FILES = [
  {
    fileCode: "SF-0091",
    title: "Obsidian Bridge Manifest",
    classification: "LEVEL-IV",
    content:
      "Fictional convoy manifest listing cargo labeled 'HEAT'. Destination redacted.",
  },
];

export const SEED_ACHIEVEMENTS = [
  {
    code: "FIRST_DESCENT",
    title: "First Descent",
    description: "Visit any digital world route.",
    points: 10,
  },
  {
    code: "TERMINAL_OPERATOR",
    title: "Terminal Operator",
    description: "Run the help command in Cyber Terminal.",
    points: 25,
  },
];