import { notFound } from "next/navigation";
import { getBuildingBySlug } from "@/lib/db";
import { BuildingUpload } from "./upload-client";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) return { title: "Edificio no encontrado" };
  return {
    title: `Cargar liquidacion — ${building.name}`,
  };
}

export default async function BuildingUploadPage({ params }: PageProps) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) notFound();

  return <BuildingUpload building={building} />;
}
