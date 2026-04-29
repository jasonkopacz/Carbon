"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  brightness: number;
  pulsePhase: number;
}

interface Edge {
  a: number;
  b: number;
  length: number;
}

interface Pulse {
  edgeIndex: number;
  t: number;       // 0→1 progress along edge
  speed: number;
  forward: boolean;
  opacity: number;
}

const ACCENT = { r: 61, g: 220, b: 151 };

function rgba(alpha: number) {
  return `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`;
}

function buildGraph(
  w: number,
  h: number,
  count: number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    radius: 2 + Math.random() * 2.5,
    brightness: 0.4 + Math.random() * 0.6,
    pulsePhase: Math.random() * Math.PI * 2,
  }));

  const maxDist = Math.min(w, h) * 0.22;
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < maxDist) {
        edges.push({ a: i, b: j, length: d });
      }
    }
  }
  return { nodes, edges };
}

export function EnergyGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];

    function resize() {
      width = canvas!.offsetWidth;
      height = canvas!.offsetHeight;
      canvas!.width = width * devicePixelRatio;
      canvas!.height = height * devicePixelRatio;
      ctx!.scale(devicePixelRatio, devicePixelRatio);

      const count = Math.round((width * height) / 14000);
      ({ nodes, edges } = buildGraph(width, height, Math.max(18, Math.min(count, 80))));
      pulses = [];
    }

    function spawnPulse() {
      if (edges.length === 0) return;
      const edgeIndex = Math.floor(Math.random() * edges.length);
      pulses.push({
        edgeIndex,
        t: 0,
        speed: 0.003 + Math.random() * 0.004,
        forward: Math.random() > 0.5,
        opacity: 0.6 + Math.random() * 0.4,
      });
    }

    function draw(timestamp: number) {
      ctx!.clearRect(0, 0, width, height);

      // Occasionally spawn new pulses
      if (Math.random() < 0.04 && pulses.length < 40) spawnPulse();

      // Move nodes (very slow drift)
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));
      }

      // Draw edges
      for (const e of edges) {
        const na = nodes[e.a];
        const nb = nodes[e.b];
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(width, height) * 0.22;
        if (dist > maxDist) continue;

        const fade = 1 - dist / maxDist;
        ctx!.beginPath();
        ctx!.moveTo(na.x, na.y);
        ctx!.lineTo(nb.x, nb.y);
        ctx!.strokeStyle = rgba(fade * 0.12);
        ctx!.lineWidth = 0.75;
        ctx!.stroke();
      }

      // Draw pulses
      pulses = pulses.filter((p) => {
        p.t += p.speed;
        if (p.t > 1) return false;

        const e = edges[p.edgeIndex];
        if (!e) return false;
        const na = nodes[e.a];
        const nb = nodes[e.b];

        const t = p.forward ? p.t : 1 - p.t;
        const px = na.x + (nb.x - na.x) * t;
        const py = na.y + (nb.y - na.y) * t;

        // Tail
        const tailLen = 0.18;
        const t0 = Math.max(0, t - tailLen);
        const tx0 = na.x + (nb.x - na.x) * t0;
        const ty0 = na.y + (nb.y - na.y) * t0;
        const grad = ctx!.createLinearGradient(tx0, ty0, px, py);
        grad.addColorStop(0, rgba(0));
        grad.addColorStop(1, rgba(p.opacity * 0.9));
        ctx!.beginPath();
        ctx!.moveTo(tx0, ty0);
        ctx!.lineTo(px, py);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Head glow
        const grd = ctx!.createRadialGradient(px, py, 0, px, py, 5);
        grd.addColorStop(0, rgba(p.opacity));
        grd.addColorStop(1, rgba(0));
        ctx!.beginPath();
        ctx!.arc(px, py, 5, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.fill();

        return true;
      });

      // Draw nodes
      for (const n of nodes) {
        const phase = (timestamp * 0.001 + n.pulsePhase) % (Math.PI * 2);
        const glow = 0.5 + 0.5 * Math.sin(phase);
        const alpha = n.brightness * (0.4 + 0.3 * glow);
        const glowR = n.radius + 4 * glow;

        // Outer glow
        const grd = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grd.addColorStop(0, rgba(alpha * 0.8));
        grd.addColorStop(1, rgba(0));
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.fill();

        // Core dot
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx!.fillStyle = rgba(alpha);
        ctx!.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);
    resize();
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
