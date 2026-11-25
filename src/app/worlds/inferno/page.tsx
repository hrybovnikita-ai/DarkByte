import { notFound } from "next/navigation";
import { fetchWorldBySlug } from "@/server/data/worlds-query";
import WorldPageTemplate from "@/components/worlds/WorldPageTemplate";

export default async function InfernoWorldPage() {
  const world = await fetchWorldBySlug("inferno");
  if (!world) {
    notFound();
  }
  return <WorldPageTemplate world={world} />;
}