import { useEffect, useRef, useCallback } from "react";

function InteractiveBg() {
  const spotRef = useRef(null);
  const orbRef1 = useRef(null);
  const orbRef2 = useRef(null);
  const orbRef3 = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const { clientX: x, clientY: y } = e;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const px = (x / w - 0.5) * 2;   // -1 to 1
    const py = (y / h - 0.5) * 2;

    if (spotRef.current) {
      spotRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(120,60,255,0.10), transparent 70%)`;
    }
    if (orbRef1.current) {
      orbRef1.current.style.transform = `translate(${px * 30}px, ${py * 20}px)`;
    }
    if (orbRef2.current) {
      orbRef2.current.style.transform = `translate(${px * -20}px, ${py * -15}px)`;
    }
    if (orbRef3.current) {
      orbRef3.current.style.transform = `translate(${px * 15}px, ${py * 25}px)`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Fine dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Coarse accent grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)",
          backgroundSize: "112px 112px",
        }}
      />

      {/* Top aurora bloom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 60% at 50% -8%, rgba(109,40,217,0.24) 0%, rgba(79,70,229,0.10) 45%, transparent 70%)",
        }}
      />
      {/* Bottom horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 28% at 50% 108%, rgba(37,99,235,0.16) 0%, transparent 70%)",
        }}
      />

      {/* Parallax Orb 1 — main purple */}
      <div
        ref={orbRef1}
        className="animate-orb absolute rounded-full blur-[140px] transition-transform duration-[1200ms] ease-out"
        style={{
          width: 680, height: 680,
          top: "-18%", left: "5%",
          background: "radial-gradient(circle, rgba(124,58,237,0.42) 0%, rgba(79,70,229,0.22) 50%, transparent 80%)",
        }}
      />
      {/* Parallax Orb 2 — deep blue */}
      <div
        ref={orbRef2}
        className="animate-orb-slow absolute rounded-full blur-[160px] transition-transform duration-[1400ms] ease-out"
        style={{
          width: 560, height: 560,
          bottom: "-8%", right: "2%",
          background: "radial-gradient(circle, rgba(37,99,235,0.32) 0%, rgba(8,145,178,0.18) 50%, transparent 80%)",
        }}
      />
      {/* Parallax Orb 3 — pink/violet */}
      <div
        ref={orbRef3}
        className="animate-orb-med absolute rounded-full blur-[120px] transition-transform duration-[1000ms] ease-out"
        style={{
          width: 400, height: 400,
          top: "32%", left: "50%",
          background: "radial-gradient(circle, rgba(219,39,119,0.28) 0%, rgba(147,51,234,0.18) 55%, transparent 80%)",
        }}
      />
      {/* Orb 4 — teal accent */}
      <div
        className="animate-orb absolute rounded-full blur-[90px]"
        style={{
          width: 240, height: 240,
          top: "58%", left: "12%",
          background: "radial-gradient(circle, rgba(20,184,166,0.22) 0%, transparent 75%)",
          animationDelay: "-9s",
        }}
      />
      {/* Orb 5 — indigo mid */}
      <div
        className="animate-orb-slow absolute rounded-full blur-[100px]"
        style={{
          width: 300, height: 300,
          top: "18%", right: "18%",
          background: "radial-gradient(circle, rgba(99,102,241,0.26) 0%, transparent 75%)",
          animationDelay: "-5s",
        }}
      />

      {/* Mouse spotlight */}
      <div ref={spotRef} className="absolute inset-0 transition-[background] duration-200" />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(3,8,18,0.75) 100%)",
        }}
      />
    </div>
  );
}

export default InteractiveBg;
