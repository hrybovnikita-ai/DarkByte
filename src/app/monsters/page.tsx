import Link from "next/link";
import FeaturedMonsters from "@/components/FeaturedMonsters";

export default function MonstersPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <header className="border-b border-zinc-800 px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="pixel-font text-sm text-red-500"
          >
            DARKBYTE
          </Link>

          <Link
            href="/"
            className="border border-zinc-700 px-4 py-2 text-sm hover:border-red-500"
          >
            BACK TO HOME
          </Link>
        </div>
      </header>

      <section className="pixel-grid border-b border-zinc-800 px-6 py-24 text-center">

        <p className="mb-6 tracking-widest text-red-500">
          RESTRICTED ACCESS
        </p>

        <h1 className="pixel-font red-glow text-2xl leading-relaxed text-red-500 sm:text-4xl">
          CLASSIFIED ENTITIES
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-xl text-zinc-400">
          An archive of fictional creatures, paranormal
          anomalies and unidentified digital entities.
        </p>

      </section>

      <FeaturedMonsters />

      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500">
        DARKBYTE DATABASE // FICTIONAL ARCHIVE
      </footer>

    </main>
  );
}
