import { notFound } from "next/navigation";
import WorldPageTemplate from "@/components/worlds/WorldPageTemplate";
import { fetchWorldBySlug } from "@/server/data/worlds-query";

export default async function OceanWorldPage() {
  const world = await fetchWorldBySlug("ocean");
  if (!world) {
    notFound();
  }
  return <WorldPageTemplate world={world} />;
}