"use client";
import HambergerIcon from "@/assets/icons/HambergerIcon";
import useHamburger from "@/hooks/useHamburger";
import LangaugeSelector from "@/widget/LangaugeSelector";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";

export default function Navbar() {
  const sidebarState = useHamburger((state) => state.toggle);
  return (
    <nav className="flex justify-between items-center gap-5 bg-[#1f1f1f] h-20 w-full px-4">
      <div className="flex items-center gap-5">
        <button onClick={sidebarState}>
          <HambergerIcon className="text-white text-2xl" />
        </button>
        <Image
          alt="logo"
          src="/logo-text.png"
          width={80}
          height={80}
          style={{ height: "auto" }}
        />
        {/* <span className="text-white text-xl font-semibold">Mitr</span> */}
      </div>
      <div className="flex gap-5">
        <UserButton />
        <LangaugeSelector />
      </div>
    </nav>
  );
}
