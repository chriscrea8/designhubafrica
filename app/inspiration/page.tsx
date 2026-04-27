"use client";
import React, { useState } from "react";
import { InspirationCard } from "@/components/cards";
import { SearchBar } from "@/components/forms/search-filter";
import { mockInspirationItems } from "@/data/mock-data";
export default function InspirationPage() {
  const [search, setSearch] = useState("");
  return <div className="py-8 lg:py-12"><div className="container mx-auto px-4 lg:px-8"><div className="mb-8"><h1 className="text-3xl lg:text-4xl font-bold">Inspiration Gallery</h1></div><SearchBar placeholder="Search by style or room…" value={search} onChange={setSearch} showFilter={false} className="mb-6" /><div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{mockInspirationItems.map((i) => <InspirationCard key={i.id} item={i} />)}</div></div></div>;
}
