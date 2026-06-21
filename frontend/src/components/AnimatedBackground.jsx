import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedBackground({ isChat = false }) {
  const canvasRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Monitor documentElement's class list for dark/light theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let stars = [];
    const starCount = 260; // Denser starfield
    const maxZ = 1000;
    const fov = 420;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars with 3D coordinates (x, y, z)
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * window.innerWidth * 2.2,
        y: (Math.random() - 0.5) * window.innerHeight * 2.2,
        z: Math.random() * maxZ,
        colorIndex: Math.floor(Math.random() * 5),
        speed: 1.5 + Math.random() * 2.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Locked center coordinates for static non-interactive flight
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      // Google signature color palette
      const darkColors = [
        [66, 133, 244],   // Blue
        [168, 127, 251],  // Purple/Indigo
        [52, 168, 83],    // Green
        [234, 67, 53],    // Red
        [251, 188, 5]     // Yellow
      ];
      
      const lightColors = [
        [26, 115, 232],   // Soft Blue
        [139, 92, 246],   // Soft Purple
        [30, 142, 62],    // Soft Green
        [217, 48, 37],    // Soft Red
        [249, 171, 0]     // Soft Yellow
      ];

      const activeColors = isDarkMode ? darkColors : lightColors;

      stars.forEach(star => {
        // Move star closer along Z axis
        star.z -= star.speed;

        // Reset star if it passes the camera viewpoint (Z <= 0)
        if (star.z <= 0) {
          star.z = maxZ;
          star.x = (Math.random() - 0.5) * window.innerWidth * 2.2;
          star.y = (Math.random() - 0.5) * window.innerHeight * 2.2;
          star.speed = 1.5 + Math.random() * 2.1;
        }

        // Project 3D position to 2D coordinates (current frame and previous frame for motion streaks)
        const prevZ = star.z + star.speed;
        const px = cx + (star.x / prevZ) * fov;
        const py = cy + (star.y / prevZ) * fov;

        const x = cx + (star.x / star.z) * fov;
        const y = cy + (star.y / star.z) * fov;

        // Culling: Skip drawing if projected coordinate is off-screen
        if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
          return;
        }

        // Draw star path
        ctx.beginPath();
        
        // Stars closer to viewer appear larger and brighter
        const size = (1 - star.z / maxZ) * 3.4 + 0.5;
        const rgb = activeColors[star.colorIndex];
        const alpha = (1 - star.z / maxZ) * (isDarkMode ? 0.95 : 0.55) + 0.05;
        
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

        // Apply a glowing neon halo in dark mode for stars in the foreground
        if (isDarkMode && star.z < maxZ * 0.4) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.8})`;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw motion blur streak if close enough, otherwise draw a tiny circle
        if (star.z < maxZ * 0.85) {
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 0.5, y);
        }
        
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isDarkMode]);

  return (
    <div className="fixed inset-0 -z-20 w-screen h-screen bg-[#f6f8fc] dark:bg-[#0d0e12] transition-colors duration-500 overflow-hidden select-none pointer-events-none">
      
      {/* Interactive Anti-Gravity Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          display: 'block',
          filter: isChat ? 'blur(3px)' : 'none',
          transition: 'filter 0.7s ease-in-out'
        }}
      />

      {/* Smooth Vignette Overlay to blend UI panels */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f6f8fc]/40 via-transparent to-[#f6f8fc]/30 dark:from-[#0d0e12]/40 dark:via-transparent dark:to-[#0d0e12]/30 pointer-events-none" />
      
      {/* Fine texture scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_97%,rgba(66,133,244,0.015)_97%)] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_97%,rgba(138,180,248,0.008)_97%)] bg-[size:100%_30px] pointer-events-none" />

    </div>
  );
}

