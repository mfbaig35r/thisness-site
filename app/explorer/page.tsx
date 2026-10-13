import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Explorer } from "@/components/explorer/Explorer";
import type { ExplorerData } from "@/components/explorer/types";
import data from "@/data/explorer.json";

export const metadata: Metadata = {
  title: "Explorer",
  description: "Entities resolved by Thisness, with the evidence for every value and a model's suggested answers to open reviews.",
};

export default function ExplorerPage() {
  const d = data as unknown as ExplorerData;
  return (
    <>
      <Header />
      <div className="explorer-page">
        <Explorer data={d} />
      </div>
      <div className="explorer-foot">{d.attribution}</div>
    </>
  );
}
