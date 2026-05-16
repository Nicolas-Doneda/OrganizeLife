import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * MagneticButton — A button that subtly "pulls" toward the cursor
 * within a configurable radius, creating a magnetic/gravity feel.
 * Uses spring-like interpolation for smooth return.
 *
 * Props:
 *   - children: Button content
 *   - radius: Magnetic field radius in px (default: 120)
 *   - strength: Pull strength 0-1 (default: 0.3)
 *   - as: Element type (default: 'button')
 *   - ...rest: Passed to the wrapper element
 */

export default function MagneticButton({
  children,
  radius = 120,
  strength = 0.3,
  as: Component = 'button',
  style = {},
  onMouseEnter,
  onMouseLeave,
  ...rest
}) {
  const wrapperRef = useRef(null);
  const innerRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Check reduced motion once
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const lerp = (a, b, t) => a + (b - a) * t;

  // Spring-like animation loop
  const animate = useCallback(() => {
    const speed = 0.15; // Smooth spring-like interpolation
    posRef.current.x = lerp(posRef.current.x, targetRef.current.x, speed);
    posRef.current.y = lerp(posRef.current.y, targetRef.current.y, speed);

    if (innerRef.current) {
      innerRef.current.style.transform =
        `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }

    // Stop when close enough
    const dx = Math.abs(posRef.current.x - targetRef.current.x);
    const dy = Math.abs(posRef.current.y - targetRef.current.y);
    if (dx > 0.1 || dy > 0.1) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion.current) return;
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      const pull = (1 - dist / radius) * strength;
      targetRef.current = { x: dx * pull, y: dy * pull };
    } else {
      targetRef.current = { x: 0, y: 0 };
    }

    startAnimation();
  }, [radius, strength, startAnimation]);

  const handleMouseEnter = useCallback((e) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback((e) => {
    setIsHovered(false);
    targetRef.current = { x: 0, y: 0 };
    startAnimation();
    onMouseLeave?.(e);
  }, [onMouseLeave, startAnimation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Listen on the window for mouse moves when hovered (catches edge moves)
  useEffect(() => {
    if (!isHovered) return;
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered, handleMouseMove]);

  return (
    <Component
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-block',
        willChange: 'transform',
        ...style,
      }}
      {...rest}
    >
      <div
        ref={innerRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          willChange: 'transform',
          transition: reducedMotion.current ? 'none' : undefined,
        }}
      >
        {children}
      </div>
    </Component>
  );
}
