import { notFound } from "next/navigation";
import { fetchWorldBySlug } from "@/server/data/worlds-query";
import WorldPageTemplate from "@/components/worlds/WorldPageTemplate";

export default async function CyberWorldPage() {
  const world = await fetchWorldBySlug("cyber");
  if (!world) {
    notFound();
  }
  return <WorldPageTemplate world={world} />;
}