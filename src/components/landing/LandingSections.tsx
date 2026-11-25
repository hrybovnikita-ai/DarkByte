import Link from "next/link";
import type { WorldConfig } from "@/config/worlds";
import GlobalTechnologyEcosystem from "@/components/landing/GlobalTechnologyEcosystem";
import WorldSelector from "@/components/landing/WorldSelector";
import WorldSections from "@/components/landing/WorldSections";
import CyberTerminal from "@/components/terminal/CyberTerminal";

const sections = [
  {
    id: "horror-world",
    number: "01",
    category: "HORROR UNIVERSE",
    title: "EXPLORE THE DARKNESS",
    description:
      "Enter a mysterious universe filled with abandoned locations, forgotten civilizations and supernatural entities. Discover hidden secrets and explore atmospheric pixel-art environments where every shadow tells a story.",
    button: "EXPLORE MONSTERS",
    href: "/monsters",
    color: "#ef4444",
    scene: "castle",
  },
  {
    id: "artificial-intelligence",
    number: "02",
    category: "ARTIFICIAL INTELLIGENCE",
    title: "BEYOND HUMAN INTELLIGENCE",
    description:
      "Discover a new approach to artificial intelligence. DarkByte is designed to combine intelligent conversations, creative tools and digital experiences inside a mysterious pixel-art universe.",
    button: "EXPLORE AI MODULE",
    href: "#ai-chat",
    color: "#a855f7",
    scene: "computer",
  },
  {
    id: "pixel-creation",
    number: "03",
    category: "CREATIVE STUDIO",
    title: "CREATE THE IMPOSSIBLE",
    description:
      "Transform your imagination into pixel art. Design mysterious characters, create atmospheric environments and experiment with colors, shapes and digital worlds.",
    button: "EXPLORE STUDIO MODULE",
    href: "#pixel-studio",
    color: "#a855f7",
    scene: "studio",
  },
  {
    id: "gaming-world",
    number: "04",
    category: "HORROR GAMING",
    title: "SURVIVE THE UNKNOWN",
    description:
      "Experience a world of suspense, mysterious adventures and terrifying discoveries. Explore the concept of interactive horror games inspired by classic retro gaming.",
    button: "EXPLORE GAMES MODULE",
    href: "#horror-games",
    color: "#ef4444",
    scene: "forest",
  },
  {
    id: "classified-archive",
    number: "05",
    category: "CLASSIFIED ARCHIVE",
    title: "SOME SECRETS NEVER DIE",
    description:
      "Discover fictional classified investigations, paranormal incidents and mysterious digital anomalies. Enter an archive where reality and imagination become indistinguishable.",
    button: "EXPLORE FILES MODULE",
    href: "#secret-files",
    color: "#ef4444",
    scene: "archive",
  },
];

function PixelScene({
  scene,
  color,
}: {
  scene: string;
  color: string;
}) {
  return (
    <svg
      viewBox="0 0 320 200"
      className="h-full w-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Pixel art ${scene}`}
    >
      <rect width="320" height="200" fill="#090909" />

      {/* STARS */}
      {Array.from({ length: 35 }, (_, i) => (
        <rect
          key={i}
          x={(i * 47 + 13) % 320}
          y={(i * 29 + 7) % 110}
          width="2"
          height="2"
          fill={color}
          opacity={0.2 + (i % 4) * 0.15}
        />
      ))}

      {scene === "castle" && (
        <>
          {/* BLOOD MOON */}
          <path
            d="M216 16H264V24H280V40H288V80H280V96H264V104H216V96H200V80H192V40H200V24H216Z"
            fill="#991b1b"
          />

          <rect x="0" y="160" width="320" height="40" fill="#141414" />

          {/* CASTLE */}
          {[30, 130, 230].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y={i === 1 ? 50 : 85}
                width="60"
                height={i === 1 ? 130 : 95}
                fill="#202020"
              />

              {[0, 24, 48].map((offset) => (
                <rect
                  key={offset}
                  x={x + offset}
                  y={i === 1 ? 40 : 75}
                  width="12"
                  height="15"
                  fill="#202020"
                />
              ))}

              <rect
                x={x + 24}
                y={i === 1 ? 75 : 110}
                width="12"
                height="22"
                fill={color}
              />
            </g>
          ))}

          <rect x="80" y="120" width="160" height="60" fill="#202020" />
          <rect x="145" y="140" width="30" height="40" fill="#080808" />
        </>
      )}

      {scene === "computer" && (
        <>
          <rect x="45" y="25" width="230" height="135" fill="#292929" />
          <rect x="55" y="35" width="210" height="115" fill="#100719" />

          {Array.from({ length: 9 }, (_, i) => (
            <rect
              key={i}
              x="70"
              y={48 + i * 10}
              width={30 + ((i * 37) % 150)}
              height="4"
              fill={color}
              opacity={0.3 + (i % 3) * 0.2}
            />
          ))}

          <rect x="145" y="160" width="30" height="20" fill="#444" />
          <rect x="105" y="180" width="110" height="8" fill="#292929" />
        </>
      )}

      {scene === "studio" && (
        <>
          <rect x="20" y="20" width="210" height="160" fill="#202020" />
          <rect x="30" y="30" width="190" height="140" fill="#101010" />

          {Array.from({ length: 14 }, (_, y) =>
            Array.from({ length: 19 }, (_, x) => (
              <rect
                key={`${x}-${y}`}
                x={30 + x * 10}
                y={30 + y * 10}
                width="9"
                height="9"
                fill={
                  (x + y) % 2 === 0
                    ? "#242424"
                    : "#181818"
                }
              />
            ))
          )}

          {[
            "00111100",
            "01111110",
            "11011011",
            "11111111",
            "11000011",
            "01111110",
          ].map((row, y) =>
            row.split("").map((pixel, x) =>
              pixel === "1" ? (
                <rect
                  key={`${x}-${y}`}
                  x={80 + x * 12}
                  y={55 + y * 12}
                  width="12"
                  height="12"
                  fill={color}
                />
              ) : null
            )
          )}

          {[
            "#ef4444",
            "#a855f7",
            "#22d3ee",
            "#22c55e",
            "#eab308",
            "#ffffff",
          ].map((fill, i) => (
            <rect
              key={fill}
              x="250"
              y={25 + i * 25}
              width="45"
              height="20"
              fill={fill}
            />
          ))}
        </>
      )}

      {scene === "forest" && (
        <>
          <rect x="0" y="155" width="320" height="45" fill="#171717" />

          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <rect
                x={i * 45}
                y={40 + (i % 3) * 15}
                width="12"
                height="140"
                fill="#242424"
              />
              <rect
                x={i * 45 - 15}
                y={65 + (i % 3) * 15}
                width="42"
                height="12"
                fill="#242424"
              />
            </g>
          ))}

          <rect x="130" y="70" width="60" height="90" fill="#030303" />
          <rect x="140" y="85" width="10" height="8" fill={color} />
          <rect x="170" y="85" width="10" height="8" fill={color} />
        </>
      )}

      {scene === "archive" && (
        <>
          {[20, 120, 220].map((x) => (
            <g key={x}>
              <rect x={x} y="25" width="80" height="150" fill="#242424" />

              {Array.from({ length: 4 }, (_, i) => (
                <g key={i}>
                  <rect
                    x={x + 8}
                    y={35 + i * 34}
                    width="64"
                    height="26"
                    fill="#101010"
                  />
                  <rect
                    x={x + 30}
                    y={44 + i * 34}
                    width="20"
                    height="5"
                    fill={color}
                  />
                </g>
              ))}
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

const questions = [
  {
    question: "What is DarkByte?",
    answer:
      "DarkByte is a digital platform combining horror, pixel art, artificial intelligence and interactive entertainment.",
  },
  {
    question: "Is DarkByte free?",
    answer:
      "DarkByte is currently in early development. Pricing and premium features will be announced in the future.",
  },
  {
    question: "Can I create my own pixel art?",
    answer:
      "Pixel Studio is a planned creative module for designing characters, artwork and digital environments.",
  },
  {
    question: "Are the monsters and investigations real?",
    answer:
      "No. All monsters, paranormal investigations and classified stories are fictional entertainment.",
  },
];

type Props = {
  worlds: WorldConfig[];
};

export default function LandingSections({ worlds }: Props) {
  return (
    <div className="overflow-hidden">

      {/* ABOUT SECTION */}
      <section className="pixel-grid border-y border-zinc-800 px-6 py-28 text-center">
        <p className="mb-6 tracking-[0.3em] text-red-500">
          {"// WELCOME TO OUR UNIVERSE"}
        </p>

        <h2 className="pixel-font mx-auto max-w-4xl text-xl leading-relaxed sm:text-3xl">
          MORE THAN A PLATFORM
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-zinc-400">
          DarkByte is a digital universe where creativity,
          technology and darkness meet. Discover mysterious
          creatures, explore fictional investigations and
          experience a new generation of pixel-art entertainment.
        </p>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["06", "CORE MODULES"],
            ["2D", "PIXEL GRAPHICS"],
            ["AI", "INTELLIGENCE"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border border-zinc-800 bg-[#101010] p-8 transition hover:border-red-600"
            >
              <div className="pixel-font text-3xl text-red-500">
                {value}
              </div>
              <p className="mt-5 tracking-widest text-zinc-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <WorldSelector worlds={worlds} />
      <WorldSections worlds={worlds} />

      <GlobalTechnologyEcosystem />

      <section className="border-y border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-center tracking-[0.25em] text-[var(--db-neon-lime)]">
            {"// CYBER TERMINAL PREVIEW"}
          </p>
          <h2 className="pixel-font text-center text-xl sm:text-2xl">
            INTERACTIVE SYSTEM SHELL
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-zinc-400">
            Run safe fictional commands: help, about, worlds, status, clear.
          </p>
          <div className="mx-auto mt-10 max-w-3xl">
            <CyberTerminal compact />
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/terminal"
              className="inline-block border border-[var(--db-neon-lime)] px-6 py-3 text-sm font-bold text-[var(--db-neon-lime)]"
            >
              ACCESS TERMINAL →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="mb-4 tracking-widest text-red-500">{"// FEATURED HORROR"}</p>
        <h2 className="pixel-font text-xl sm:text-2xl">MONSTERS & STORIES</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <article className="border border-zinc-800 bg-[#101010] p-8">
            <h3 className="text-xl font-bold text-red-500">Featured Creatures</h3>
            <p className="mt-4 text-zinc-400">
              Browse the monster database for fictional entities, threat classes
              and lore fragments indexed by the horror module.
            </p>
            <Link
              href="/monsters"
              className="mt-6 inline-block text-sm font-bold text-red-400"
            >
              OPEN MONSTER DATABASE →
            </Link>
          </article>
          <article className="border border-zinc-800 bg-[#101010] p-8">
            <h3 className="text-xl font-bold text-purple-400">Horror Stories</h3>
            <p className="mt-4 text-zinc-400">
              Serialized nightmares and classified files—story modules unlock as
              DarkByte development continues.
            </p>
            <Link
              href="/#classified-archive"
              className="mt-6 inline-block text-sm font-bold text-purple-400"
            >
              READ ARCHIVE MODULE →
            </Link>
          </article>
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-[#0a0612] px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <p className="tracking-widest text-[var(--db-violet)]">
            {"// AI & PIXEL STUDIO"}
          </p>
          <h2 className="pixel-font mt-6 text-xl sm:text-2xl">
            INTELLIGENCE MEETS PIXELS
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            AI chat and Pixel Studio modules extend the universe with generative
            tools and creative workspaces—staged on the home feature grid above.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/#artificial-intelligence"
              className="border border-purple-600 px-6 py-3 text-purple-400"
            >
              AI SHOWCASE
            </Link>
            <Link
              href="/#pixel-creation"
              className="border border-purple-600 px-6 py-3 text-purple-400"
            >
              PIXEL STUDIO
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE SECTIONS */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className="border-b border-zinc-900 px-6 py-24 sm:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">

            {/* PIXEL IMAGE */}
            <div
              className={`group relative overflow-hidden border border-zinc-800 bg-[#101010] transition duration-500 hover:-translate-y-2 ${
                index % 2 !== 0 ? "lg:order-2" : ""
              }`}
              style={{
                boxShadow: `0 0 35px ${section.color}15`,
              }}
            >
              <div className="aspect-video overflow-hidden">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                  <PixelScene
                    scene={section.scene}
                    color={section.color}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
                <span className="text-sm text-zinc-500">
                  DARKBYTE // MODULE {section.number}
                </span>

                <span
                  className="motion-safe:animate-pulse"
                  style={{ color: section.color }}
                >
                  ●
                </span>
              </div>
            </div>

            {/* SECTION TEXT */}
            <div>
              <p
                className="mb-5 tracking-[0.2em]"
                style={{ color: section.color }}
              >
                {`${section.number} // ${section.category}`}
              </p>

              <h2 className="pixel-font text-xl leading-relaxed sm:text-3xl">
                {section.title}
              </h2>

              <p className="mt-7 text-xl leading-relaxed text-zinc-400">
                {section.description}
              </p>

              <Link
                href={section.href}
                className="mt-8 inline-block border px-7 py-4 text-sm tracking-wider transition hover:bg-white/10"
                style={{
                  borderColor: section.color,
                  color: section.color,
                }}
              >
                {section.button} →
              </Link>
            </div>

          </div>
        </section>
      ))}

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-28">
        <p className="mb-5 text-center tracking-widest text-purple-500">
          {"// SYSTEM INFORMATION"}
        </p>

        <h2 className="pixel-font mb-12 text-center text-2xl">
          FAQ
        </h2>

        <div className="space-y-4">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group border border-zinc-800 bg-[#101010] p-6 transition hover:border-red-700"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl">
                {item.question}

                <span className="text-red-500 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <p className="mt-5 border-t border-zinc-800 pt-5 text-lg leading-relaxed text-zinc-400">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="pixel-grid relative overflow-hidden border-y border-red-950 bg-[#100505] px-6 py-32 text-center">

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-900/30 blur-[120px]"
        />

        <div className="relative">
          <p className="mb-8 tracking-[0.3em] text-red-500">
            {"// ACCESS GRANTED"}
          </p>

          <h2 className="pixel-font mx-auto max-w-5xl text-2xl leading-relaxed sm:text-4xl">
            THE DARKNESS IS
            <br />
            <span className="red-glow text-red-500">
              ONLY THE BEGINNING
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-xl text-zinc-400">
            Create your account and become part of the
            DarkByte universe.
          </p>

          <Link
            href="/sign-up"
            className="pixel-font mt-10 inline-block border border-red-500 bg-red-600 px-8 py-5 text-xs transition hover:bg-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
          >
            JOIN DARKBYTE →
          </Link>
        </div>

      </section>

    </div>
  );
}
