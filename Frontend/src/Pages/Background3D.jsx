import { useEffect, useRef } from "react";

function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;

    // Mouse Interaction
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let rotateX = 0;
    let rotateY = 0;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Map mouse position to small camera rotations
      targetRotateY = (mouseX - width / 2) * 0.0004;
      targetRotateX = (mouseY - height / 2) * 0.0004;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Cube and Space Dust definitions
    const cubeCount = 20;
    const cubes = [];
    const dustCount = 120;
    const dust = [];

    // Helper to rotate a point in 3D
    const rotatePointX = (p, sin, cos) => {
      const y = p[1] * cos - p[2] * sin;
      const z = p[1] * sin + p[2] * cos;
      return [p[0], y, z];
    };

    const rotatePointY = (p, sin, cos) => {
      const x = p[0] * cos + p[2] * sin;
      const z = -p[0] * sin + p[2] * cos;
      return [x, p[1], z];
    };

    const rotatePointZ = (p, sin, cos) => {
      const x = p[0] * cos - p[1] * sin;
      const y = p[0] * sin + p[1] * cos;
      return [x, y, p[2]];
    };

    // Initialize space dust particles (stars)
    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: (Math.random() - 0.5) * (width * 1.8),
        y: (Math.random() - 0.5) * (height * 1.8),
        z: (Math.random() - 0.5) * 500 - 150, // pushed back in space
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.7 + Math.random() * 1.3,
        colorType: i % 3,
      });
    }

    // Initialize random cubes spread across the whole screen width/height
    for (let i = 0; i < cubeCount; i++) {
      const size = 20 + Math.random() * 60; // 20px to 80px size variance
      cubes.push({
        // World coordinates fully dispersed
        x: (Math.random() - 0.5) * (width * 1.8),
        y: (Math.random() - 0.5) * (height * 1.8),
        z: (Math.random() - 0.5) * 400 - 100,
        
        // World velocities
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.15,

        // Local rotation angles
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,

        // Local spin speeds
        srx: 0.002 + Math.random() * 0.004,
        sry: 0.002 + Math.random() * 0.004,
        srz: 0.001 + Math.random() * 0.003,

        size: size,
        // Colors: Purple (0), Blue (1), Cyan (2)
        colorType: i % 3,
        projCenter: null,
      });
    }

    // Base geometry vertices of a unit cube
    const baseVertices = [
      [-0.5, -0.5, -0.5], // 0
      [0.5, -0.5, -0.5],  // 1
      [0.5, 0.5, -0.5],   // 2
      [-0.5, 0.5, -0.5],  // 3
      [-0.5, -0.5, 0.5],  // 4
      [0.5, -0.5, 0.5],   // 5
      [0.5, 0.5, 0.5],    // 6
      [-0.5, 0.5, 0.5],   // 7
    ];

    // Faces defined by vertex indices
    const baseFaces = [
      [0, 1, 2, 3], // Back
      [1, 5, 6, 2], // Right
      [5, 4, 7, 6], // Front
      [4, 0, 3, 7], // Left
      [3, 2, 6, 7], // Top
      [4, 5, 1, 0], // Bottom
    ];

    const render = () => {
      time += 0.008; // Increment time for slow animations

      // 1. Draw Organic Color Blending Nebula Backdrop
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Light Center 1 (Purple Glow, orbits center slowly + reacts to mouse)
      const cx1 = width / 2 + Math.cos(time * 0.4) * (width * 0.12) + (mouseX - width / 2) * 0.08;
      const cy1 = height / 2 + Math.sin(time * 0.4) * (height * 0.12) + (mouseY - height / 2) * 0.08;
      const grad1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, Math.max(width, height) * 0.65);
      grad1.addColorStop(0, "rgba(147, 51, 234, 0.14)"); // Purple
      grad1.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Light Center 2 (Cyan/Blue Glow, orbits in opposite direction)
      const cx2 = width / 2 - Math.cos(time * 0.3) * (width * 0.18) + (mouseX - width / 2) * 0.08;
      const cy2 = height / 2 - Math.sin(time * 0.3) * (height * 0.18) + (mouseY - height / 2) * 0.08;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, Math.max(width, height) * 0.6);
      grad2.addColorStop(0, "rgba(6, 182, 212, 0.07)");  // Cyan
      grad2.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Smooth camera tilt damping
      rotateX += (targetRotateX - rotateX) * 0.05;
      rotateY += (targetRotateY - rotateY) * 0.05;

      const cosCamX = Math.cos(rotateX);
      const sinCamX = Math.sin(rotateX);
      const cosCamY = Math.cos(rotateY);
      const sinCamY = Math.sin(rotateY);

      const focalLength = 500;
      const zOffset = 500; // Eye distance

      // 2. Draw Background Space Dust Particles with Twinkles & Flares
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        d.x += d.vx;
        d.y += d.vy;

        // Wrap boundaries
        const boundX = width * 0.95;
        const boundY = height * 0.95;
        if (Math.abs(d.x) > boundX) d.x = -d.x;
        if (Math.abs(d.y) > boundY) d.y = -d.y;

        // Rotate by camera coordinates
        const rx1 = d.x * cosCamY - d.z * sinCamY;
        const rz1 = d.x * sinCamY + d.z * cosCamY;

        const ry2 = d.y * cosCamX - rz1 * sinCamX;
        const rz2 = d.y * sinCamX + rz1 * cosCamX;

        // Project coordinate
        const scale = focalLength / (focalLength + rz2 + zOffset);
        const px = rx1 * scale + width / 2;
        const py = ry2 * scale + height / 2;

        // Twinkle factor using time and node index
        const twinkle = Math.sin(time * 2.5 + i) * 0.45 + 0.55;

        // Fade using distance scale factor
        const depthFactor = Math.max(0, Math.min(1, (650 - rz2) / 900));
        const opacity = 0.22 * scale * depthFactor * twinkle;

        ctx.beginPath();
        ctx.arc(px, py, d.size * scale, 0, Math.PI * 2);

        if (d.colorType === 0) {
          ctx.fillStyle = `rgba(168, 85, 247, ${opacity})`;
        } else if (d.colorType === 1) {
          ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(6, 182, 212, ${opacity})`;
        }
        ctx.fill();

        // Render thin 4-pointed cross flares on 15% of brightest dust particles
        if (i % 7 === 0 && opacity > 0.16) {
          ctx.beginPath();
          const flare = d.size * scale * 2.2;
          ctx.moveTo(px - flare, py);
          ctx.lineTo(px + flare, py);
          ctx.moveTo(px, py - flare);
          ctx.lineTo(px, py + flare);
          
          if (d.colorType === 0) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${opacity * 0.35})`;
          } else if (d.colorType === 1) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.35})`;
          } else {
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.35})`;
          }
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      const allFaces = [];

      // Update positions and compute projected coordinates for cubes
      for (let c = 0; c < cubes.length; c++) {
        const cube = cubes[c];

        // Move cube in world coordinates
        cube.x += cube.vx;
        cube.y += cube.vy;
        cube.z += cube.vz;

        // Bounce back if boundaries are reached (dispersed fully across whole page screen)
        const boundaryX = width * 0.95;
        const boundaryY = height * 0.95;
        if (Math.abs(cube.x) > boundaryX) cube.vx *= -1;
        if (Math.abs(cube.y) > boundaryY) cube.vy *= -1;
        if (Math.abs(cube.z) > 300) cube.vz *= -1;

        // Spin locally
        cube.rx += cube.srx;
        cube.ry += cube.sry;
        cube.rz += cube.srz;

        // Local rotation angles
        const cosLX = Math.cos(cube.rx);
        const sinLX = Math.sin(cube.rx);
        const cosLY = Math.cos(cube.ry);
        const sinLY = Math.sin(cube.ry);
        const cosLZ = Math.cos(cube.rz);
        const sinLZ = Math.sin(cube.rz);

        // Project cube center to coordinate space for connections
        const cx1 = cube.x * cosCamY - cube.z * sinCamY;
        const cz1 = cube.x * sinCamY + cube.z * cosCamY;
        const cy2 = cube.y * cosCamX - cz1 * sinCamX;
        const cz2 = cube.y * sinCamX + cz1 * cosCamX;

        const scaleCenter = focalLength / (focalLength + cz2 + zOffset);
        const pcx = cx1 * scaleCenter + width / 2;
        const pcy = cy2 * scaleCenter + height / 2;

        cube.projCenter = { x: pcx, y: pcy, z: cz2 };

        // Rotate & Translate Cube Vertices
        const projectedVerts = [];
        const worldVerts = [];

        for (let v = 0; v < baseVertices.length; v++) {
          const bv = baseVertices[v];
          let p = [bv[0] * cube.size, bv[1] * cube.size, bv[2] * cube.size];

          // Rotate locally
          p = rotatePointZ(p, sinLZ, cosLZ);
          p = rotatePointY(p, sinLY, cosLY);
          p = rotatePointX(p, sinLX, cosLX);

          // Translate to world position
          const wx = p[0] + cube.x;
          const wy = p[1] + cube.y;
          const wz = p[2] + cube.z;

          // Rotate by global camera yaw & pitch
          const rx1 = wx * cosCamY - wz * sinCamY;
          const rz1 = wx * sinCamY + wz * cosCamY;

          const ry2 = wy * cosCamX - rz1 * sinCamX;
          const rz2 = wy * sinCamX + rz1 * cosCamX;

          worldVerts.push({ x: rx1, y: ry2, z: rz2 });

          // Project coordinates to 2D
          const scale = focalLength / (focalLength + rz2 + zOffset);
          const px = rx1 * scale + width / 2;
          const py = ry2 * scale + height / 2;

          projectedVerts.push({ x: px, y: py, z: rz2, scale: scale });
        }

        // Construct Face Metadata
        for (let f = 0; f < baseFaces.length; f++) {
          const faceIdxs = baseFaces[f];
          
          const avgZ = (
            worldVerts[faceIdxs[0]].z +
            worldVerts[faceIdxs[1]].z +
            worldVerts[faceIdxs[2]].z +
            worldVerts[faceIdxs[3]].z
          ) / 4;

          allFaces.push({
            p0: projectedVerts[faceIdxs[0]],
            p1: projectedVerts[faceIdxs[1]],
            p2: projectedVerts[faceIdxs[2]],
            p3: projectedVerts[faceIdxs[3]],
            avgZ: avgZ,
            colorType: cube.colorType,
            faceIndex: f,
          });
        }
      }

      // 3. Draw Faint Connection Lines (Quantum Links) between close floating cubes
      for (let c1 = 0; c1 < cubes.length; c1++) {
        for (let c2 = c1 + 1; c2 < cubes.length; c2++) {
          const cubeA = cubes[c1];
          const cubeB = cubes[c2];
          if (!cubeA.projCenter || !cubeB.projCenter) continue;

          const dx = cubeA.projCenter.x - cubeB.projCenter.x;
          const dy = cubeA.projCenter.y - cubeB.projCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if within proximity threshold
          if (dist < 220) {
            const avgZ = (cubeA.projCenter.z + cubeB.projCenter.z) / 2;
            const depthFactor = Math.max(0, Math.min(1, (650 - avgZ) / 1000));
            const opacity = (1 - dist / 220) * 0.12 * depthFactor;

            ctx.beginPath();
            ctx.moveTo(cubeA.projCenter.x, cubeA.projCenter.y);
            ctx.lineTo(cubeB.projCenter.x, cubeB.projCenter.y);
            
            // Faint neon indigo links
            ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // 4. Painter's Algorithm Depth Sort (Furthest faces first)
      allFaces.sort((a, b) => b.avgZ - a.avgZ);

      // 5. Render Faces
      for (let i = 0; i < allFaces.length; i++) {
        const face = allFaces[i];
        const depthFactor = Math.max(0, Math.min(1, (650 - face.avgZ) / 1000));
        
        ctx.beginPath();
        ctx.moveTo(face.p0.x, face.p0.y);
        ctx.lineTo(face.p1.x, face.p1.y);
        ctx.lineTo(face.p2.x, face.p2.y);
        ctx.lineTo(face.p3.x, face.p3.y);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(face.p0.x, face.p0.y, face.p2.x, face.p2.y);
        const fillOpacity = 0.03 * depthFactor;

        if (face.colorType === 0) {
          fillGrad.addColorStop(0, `rgba(168, 85, 247, ${fillOpacity})`);
          fillGrad.addColorStop(1, `rgba(139, 92, 246, ${fillOpacity * 2.2})`);
        } else if (face.colorType === 1) {
          fillGrad.addColorStop(0, `rgba(59, 130, 246, ${fillOpacity})`);
          fillGrad.addColorStop(1, `rgba(37, 99, 235, ${fillOpacity * 2.2})`);
        } else {
          fillGrad.addColorStop(0, `rgba(6, 182, 212, ${fillOpacity})`);
          fillGrad.addColorStop(1, `rgba(8, 145, 178, ${fillOpacity * 2.2})`);
        }

        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Neon Glow Outlines
        ctx.beginPath();
        ctx.moveTo(face.p0.x, face.p0.y);
        ctx.lineTo(face.p1.x, face.p1.y);
        ctx.lineTo(face.p2.x, face.p2.y);
        ctx.lineTo(face.p3.x, face.p3.y);
        ctx.closePath();

        const outlineOpacity = (face.faceIndex === 4 ? 0.35 : 0.18) * depthFactor;
        
        if (face.colorType === 0) {
          ctx.strokeStyle = `rgba(168, 85, 247, ${outlineOpacity})`;
        } else if (face.colorType === 1) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${outlineOpacity})`;
        } else {
          ctx.strokeStyle = `rgba(6, 182, 212, ${outlineOpacity})`;
        }

        ctx.lineWidth = Math.max(0.4, 0.9 * face.p0.scale);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none z-0" />;
}

export default Background3D;
