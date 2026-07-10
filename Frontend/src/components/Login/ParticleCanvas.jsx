import { useEffect, useRef } from "react";

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let mouseX = W / 2, mouseY = H / 2;

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const onMove   = (e) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener("resize",    onResize, { passive: true });
    window.addEventListener("mousemove", onMove,   { passive: true });

    // Nodes
    const NODE_COUNT = 55;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r:  Math.random() * 1.6 + 0.4,
      pulse: Math.random() * Math.PI * 2,
    }));

    const LINK_DIST = 160;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Mouse attraction
      nodes.forEach(n => {
        const dx = mouseX - n.x, dy = mouseY - n.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 260) {
          n.vx += (dx / d) * 0.012;
          n.vy += (dy / d) * 0.012;
        }
        n.vx *= 0.97; n.vy *= 0.97;
        n.x += n.vx; n.y += n.vy;
        n.pulse += 0.018;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const a = (1 - d / LINK_DIST) * 0.22;
            const grd = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grd.addColorStop(0, `rgba(139,92,246,${a})`);
            grd.addColorStop(1, `rgba(59,130,246,${a * 0.6})`);
            ctx.beginPath();
            ctx.strokeStyle = grd;
            ctx.lineWidth   = 0.7;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes (dots)
      nodes.forEach(n => {
        const glow = (Math.sin(n.pulse) + 1) / 2;
        const alpha = 0.35 + glow * 0.45;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + glow * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,85,247,${alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",    onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-70" />;
}

export default ParticleCanvas;
