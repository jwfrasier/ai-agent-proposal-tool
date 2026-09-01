// Motion helpers (GSAP). Discipline: motion conveys arrival and state only,
// short ease-out, and every effect is skipped under prefers-reduced-motion.

import { gsap } from "gsap";

export const motionOK = () =>
  typeof window !== "undefined" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Stagger a set of elements into place on mount.
export function enterStagger(targets, opts = {}) {
  if (!motionOK() || !targets?.length) return;
  gsap.from(targets, {
    y: 14,
    opacity: 0,
    duration: 0.45,
    ease: "power2.out",
    stagger: 0.07,
    clearProps: "all",
    ...opts,
  });
}

// Light rise for a container on step change.
export function stepEnter(el) {
  if (!motionOK() || !el) return;
  gsap.fromTo(
    el,
    { y: 10, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.28, ease: "power2.out", clearProps: "all" }
  );
}

// One-time attention pull for the evaluator pill: a soft double halo pulse,
// ~1.5s after load, once per session. Never loops forever.
export function evaluatorAttention(el) {
  if (!motionOK() || !el) return;
  try {
    if (sessionStorage.getItem("vaers-demo-eval-nudge")) return;
    sessionStorage.setItem("vaers-demo-eval-nudge", "1");
  } catch {
    /* demo only */
  }
  const tl = gsap.timeline({ delay: 1.5 });
  tl.to(el, {
    scale: 1.07,
    boxShadow: "0 0 0 6px rgba(138, 63, 252, 0.25)",
    duration: 0.3,
    ease: "power2.out",
  })
    .to(el, {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(138, 63, 252, 0)",
      duration: 0.45,
      ease: "power2.out",
    })
    .to(el, {
      scale: 1.05,
      boxShadow: "0 0 0 5px rgba(138, 63, 252, 0.2)",
      duration: 0.3,
      ease: "power2.out",
    })
    .to(el, {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(138, 63, 252, 0)",
      duration: 0.5,
      ease: "power2.out",
      clearProps: "all",
    });
}
