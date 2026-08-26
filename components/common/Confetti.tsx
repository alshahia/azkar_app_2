
import React, { useEffect, useRef } from 'react';

const Confetti: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to full screen
        const resizeCanvas = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle configuration
        const colors = ['#10B981', '#34D399', '#F59E0B', '#FCD34D', '#3B82F6', '#EF4444'];
        const particleCount = 150;
        const particles: any[] = [];

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height, // Start above screen
                vx: (Math.random() - 0.5) * 3, // Horizontal velocity
                vy: Math.random() * 3 + 2, // Falling speed
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 5
            });
        }

        let animationId: number;
        let opacity = 1;
        const fadeStart = 3000; // Start fading out after 3 seconds
        const startTime = Date.now();

        const update = () => {
            if (!ctx || !canvas) return;
            
            const elapsed = Date.now() - startTime;
            
            // Handle fade out
            if (elapsed > fadeStart) {
                opacity -= 0.01;
            }

            if (opacity <= 0) {
                cancelAnimationFrame(animationId);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = opacity;

            particles.forEach(p => {
                // Physics
                p.y += p.vy;
                p.x += p.vx;
                p.rotation += p.rotationSpeed;
                
                // Swaying effect
                p.vx += Math.sin(p.y * 0.01) * 0.05;

                // Wrap around (if needed, but here we just let them fall)
                // For this specific celebration, let's recycle them to top if they fall too fast within the first few seconds
                if (p.y > canvas.height && elapsed < fadeStart) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }

                // Draw
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                
                // Draw square confetti
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                
                ctx.restore();
            });

            animationId = requestAnimationFrame(update);
        };

        update();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-50 h-full w-full"
        />
    );
};

export default Confetti;
