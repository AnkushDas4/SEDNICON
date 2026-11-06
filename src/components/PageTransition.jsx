import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { animate } from 'animejs';

export default function PageTransition({ children }) {
  const containerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!containerRef.current) return;

    // Smooth page load & route redirect transition using anime.js
    animate(containerRef.current, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 550,
      ease: 'outCubic',
    });

    // Stagger any sub-elements marked with .anime-stagger
    const staggered = containerRef.current.querySelectorAll('.anime-stagger');
    if (staggered.length > 0) {
      animate(staggered, {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 500,
        delay: (el, i) => i * 40,
        ease: 'outCubic',
      });
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
