import { useEffect, useRef, useCallback } from "react";

function OrbBg() {
  const spotRef = useRef(null);
  const o1 = useRef(null), o2 = useRef(null), o3 = useRef(null);

  const onMove = useCallback((e) => {
    const px = (e.clientX / window.innerWidth  - 0.5) * 2;
    const py = (e.clientY / window.innerHeight - 0.5) * 2;
    if (spotRef.current) spotRef.current.style.background = `radial-gradient(900px circle at ${e.clientX}px ${e.clientY}px, rgba(120,60,255,0.07), transparent 65%)`;
    if (o1.current) o1.current.style.transform = `translate(${px * 40}px, ${py * 28}px)`;
    if (o2.current) o2.current.style.transform = `translate(${px * -28}px, ${py * -20}px)`;
    if (o3.current) o3.current.style.transform = `translate(${px * 18}px, ${py * 30}px)`;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [onMove]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 130% 70% at 50% -15%, rgba(109,40,217,0.30) 0%, rgba(79,70,229,0.12) 45%, transparent 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 35% at 50% 115%, rgba(37,99,235,0.20) 0%, transparent 65%)" }} />
      {/* Right glow for form side */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 80% at 100% 50%, rgba(79,70,229,0.10) 0%, transparent 60%)" }} />

      <div ref={o1} className="animate-orb absolute rounded-full blur-[160px] transition-transform duration-[1400ms] ease-out"
        style={{ width: 800, height: 800, top: "-25%", left: "0%", background: "radial-gradient(circle, rgba(124,58,237,0.40) 0%, rgba(79,70,229,0.18) 55%, transparent 80%)" }} />
      <div ref={o2} className="animate-orb-slow absolute rounded-full blur-[180px] transition-transform duration-[1600ms] ease-out"
        style={{ width: 640, height: 640, bottom: "-12%", right: "-5%", background: "radial-gradient(circle, rgba(37,99,235,0.30) 0%, rgba(8,145,178,0.15) 55%, transparent 80%)" }} />
      <div ref={o3} className="animate-orb-med absolute rounded-full blur-[130px] transition-transform duration-[1100ms] ease-out"
        style={{ width: 420, height: 420, top: "38%", left: "45%", background: "radial-gradient(circle, rgba(219,39,119,0.22) 0%, rgba(147,51,234,0.14) 55%, transparent 80%)" }} />
      <div className="animate-orb absolute rounded-full blur-[100px]"
        style={{ width: 260, height: 260, top: "62%", left: "8%", background: "radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 75%)", animationDelay: "-8s" }} />

      <div ref={spotRef} className="absolute inset-0 transition-[background] duration-100" />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 110% 110% at 50% 50%, transparent 35%, rgba(5,8,20,0.82) 100%)" }} />
    </div>
  );
}

export default OrbBg;
