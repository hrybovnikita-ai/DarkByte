"use client";

import { useEffect, useState } from "react";

export default function ScrollChrome() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    function onScroll() {
      const max =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      root.style.setProperty("--scroll-progress", `${pct}%`);
      setShowTop(window.scrollY > 480);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const reveals = document.querySelectorAll(".section-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    reveals.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        className="scroll-progress"
        role="presentation"
        aria-hidden="true"
      />
      <a
        href="#home"
        className={`back-to-top border border-red-600 bg-[#101010] px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-600/20 ${
          showTop ? "is-visible" : ""
        }`}
      >
        TOP ↑
      </a>
    </>
  );
}