import { VeroxaApp } from "../page";

export default async function VeroxaRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <VeroxaApp initialPath={`/${slug.join("/")}`} />;
}
