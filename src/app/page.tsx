import PricingSection from "@/components/credits/PricingSection";
import HomeWorldsSection from "@/components/home/HomeWorldsSection";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollChrome from "@/components/layout/ScrollChrome";

const features = [
  {
    icon: "🤖",
    title: "AI Chat",
    description: "Explore artificial intelligence beyond human imagination.",
    color: "#a855f7",
    category: "INTELLIGENCE",
  },
  {
    icon: "💀",
    title: "Monster Database",
    description: "Discover terrifying creatures hidden in the darkness.",
    color: "#ef4444",
    category: "HORROR",
  },
  {
    icon: "📖",
    title: "Horror Stories",
    description: "Enter a world of nightmares and mysterious stories.",
    color: "#ef4444",
    category: "STORIES",
  },
  {
    icon: "👾",
    title: "Pixel Studio",
    description: "Create unique pixel characters, worlds and artwork.",
    color: "#a855f7",
    category: "CREATIVITY",
  },
  {
    icon: "🎮",
    title: "Horror Games",
    description: "Survive terrifying adventures inside pixel worlds.",
    color: "#ef4444",
    category: "GAMING",
  },
  {
    icon: "📁",
    title: "Secret Files",
    description: "Investigate classified documents and unknown entities.",
    color: "#a855f7",
    category: "CLASSIFIED",
  },
];

const skull = [
  "0011111100",
  "0111111110",
  "1111111111",
  "1100110011",
  "1100110011",
  "1111001111",
  "0111111110",
  "0010101000",
  "0011111000",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <ScrollChrome />
      <SiteHeader />

      <main>

        {/* HERO SECTION */}
        <section
          id="home"
          className="relative flex min-h-[85vh] scroll-mt-32 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
        >

          {/* PIXEL GRID */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* RED GLOW */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-[400px] w-[400px] max-w-full rounded-full bg-red-900/25 blur-[120px]"
          />

          <div className="relative z-10 flex flex-col items-center">

            {/* SYSTEM STATUS */}
            <div className="mb-12 flex items-center gap-3 border border-red-900 bg-red-950/20 px-4 py-2 text-xs tracking-widest text-red-400">
              <span className="h-2 w-2 bg-red-500 motion-safe:animate-pulse" />
              SYSTEM ONLINE
            </div>

            {/* PIXEL SKULL */}
            <div
              role="img"
              aria-label="Red pixel art skull"
              className="mb-12 grid grid-cols-10 gap-0 drop-shadow-[0_0_25px_rgba(239,68,68,0.65)] motion-safe:animate-pulse"
            >
              {skull.flatMap((row, y) =>
                row.split("").map((pixel, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="h-3 w-3 sm:h-5 sm:w-5"
                    style={{
                      backgroundColor:
                        pixel === "1"
                          ? y < 3
                            ? "#ff4545"
                            : "#b91c1c"
                          : "transparent",
                    }}
                  />
                ))
              )}
            </div>

            <p className="mb-4 text-xs tracking-[0.4em] text-red-500">
              WELCOME TO DARKBYTE
            </p>

            
           <h1 className="pixel-font max-w-5xl text-2xl leading-relaxed sm:text-4xl lg:text-6xl">
            ENTER THE
             <br />
            <span className="red-glow text-red-600">
             DARK SIDE
           </span>
          </h1>


            <p className="mt-8 max-w-2xl text-sm leading-8 text-zinc-400 sm:text-lg">
              A digital universe where horror, pixel art and artificial
              intelligence collide. Discover the unknown. Create the impossible.
              Explore the darkness.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">

              <a
                href="#features"
                className="border border-red-600 bg-red-600 px-8 py-4 text-sm font-bold transition hover:bg-red-700"
              >
                ENTER DARKBYTE
              </a>

              <a
                href="#ai-chat"
                className="border border-purple-600 bg-purple-950/20 px-8 py-4 text-sm font-bold text-purple-400 transition hover:bg-purple-600 hover:text-white"
              >
                EXPLORE AI
              </a>

            </div>

            <p className="mt-12 text-xs tracking-widest text-zinc-600">
              VERSION 0.1.0 // EARLY ACCESS
            </p>

          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="mx-auto max-w-7xl scroll-mt-32 px-6 py-24"
        >

          <div className="mb-12">
            <p className="mb-3 text-sm tracking-widest text-red-500">
              {"// EXPLORE THE UNKNOWN"}
            </p>

            <h2 className="text-3xl font-black sm:text-5xl">
              DARKBYTE MODULES
            </h2>

            <p className="mt-4 text-zinc-500">
              Choose your path into the digital darkness.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {features.map((feature) => (
              <article
                key={feature.title}
                id={feature.title.toLowerCase().replaceAll(" ", "-")}
                className="group scroll-mt-32 border border-zinc-800 bg-[#101010] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-red-700 hover:bg-[#151515]"
              >

                <div className="mb-6 text-4xl" aria-hidden="true">
                  {feature.icon}
                </div>

                <p
                  className="mb-3 text-xs tracking-widest"
                  style={{ color: feature.color }}
                >
                  {feature.category}
                </p>

                <h3 className="mb-4 text-xl font-bold">
                  {feature.title}
                </h3>

                <p className="min-h-20 text-sm leading-7 text-zinc-500">
                  {feature.description}
                </p>

                <button
                  disabled
                  className="mt-6 border border-zinc-700 px-4 py-2 text-xs text-zinc-500 disabled:cursor-not-allowed"
                >
                  COMING SOON
                </button>

              </article>
            ))}

          </div>
        </section>

        <section
          aria-hidden="true"
          className="relative h-32 overflow-hidden border-y border-zinc-900 sm:h-48"
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "linear-gradient(90deg,#FF003C,#9333EA,#2563FF,#10B981,#FFD700,#FF8800)",
            }}
          />
          <div className="pixel-grid absolute inset-0" />
          <p className="relative flex h-full items-center justify-center text-sm tracking-[0.5em] text-white/90 sm:text-base">
            MULTICOLOR PIXEL UNIVERSE — DARKBYTE 2.0
          </p>
        </section>

        <HomeWorldsSection />

        {/* INFORMATION SECTION */}
        <section className="border-y border-zinc-900 bg-[#0d0d0d] px-6 py-24 text-center">

          <p className="mb-4 text-sm tracking-widest text-purple-500">
            {"// THE NEXT GENERATION"}
          </p>

          <h2 className="text-3xl font-black sm:text-5xl">
            BEYOND REALITY
          </h2>

          <p className="mx-auto mt-6 max-w-2xl leading-8 text-zinc-500">
            DarkByte combines artificial intelligence, interactive horror
            experiences and pixel art into one digital platform.
            The darkness is only the beginning.
          </p>

        </section>

        <PricingSection />
      </main>

      <SiteFooter />

    </div>
  );
}
