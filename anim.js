gsap.registerPlugin(ScrollTrigger);

gsap.from(".load", {
  opacity: 0,
  y: 20,
  duration: 0.8,
  stagger: 0.15,
  ease: "power2.out"
});

gsap.to(".reveal", {
  scrollTrigger: {
    trigger: ".reveal",
    start: "top 80%",
    toggleActions: "play none none none"
  },
  opacity: 1,
  y: 0,
  duration: 0.6,
  stagger: 0.2,
  ease: "power2.out"
});
