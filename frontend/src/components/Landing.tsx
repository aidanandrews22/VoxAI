import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";
import Features from "./landing/Features";
import DemoSection from "./landing/DemoSection";
import CTASection from "./landing/CTASection";
import FloatingElements from "./landing/FloatingElements";
import Footer from "./landing/Footer";


const Landing: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.js Background
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    // Use adaptive particle color based on color scheme
    const getParticleColor = () => {
      if (document.documentElement.classList.contains('force-light')) {
        return "#38bdf8"; // Sky color for light mode
      } else if (document.documentElement.classList.contains('force-dark')) {
        return "#38bdf8"; // Sky color for dark mode
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return "#38bdf8"; // Sky color for dark mode
      } else {
        return "#38bdf8"; // Sky color for light mode
      }
    };

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.025, // Increased from 0.008 to make particles bigger
      color: getParticleColor(),
      transparent: true,
      opacity: 0.6,
    });

    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    scene.add(particlesMesh);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Visibility API to pause animation when tab is not visible
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Animation with throttling
    let lastTime = 0;
    const fps = 30; // Limit to 30 FPS
    const interval = 1000 / fps;
    
    const animate = (currentTime: number) => {
      if (!isVisible) {
        requestAnimationFrame(animate);
        return;
      }
      
      const delta = currentTime - lastTime;
      
      if (delta > interval) {
        lastTime = currentTime - (delta % interval);
        
        particlesMesh.rotation.x += 0.0003;
        particlesMesh.rotation.y += 0.0003;
        renderer.render(scene, camera);
      }
      
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    // Update particle color when color scheme changes
    const updateParticleColor = () => {
      particlesMaterial.color.set(getParticleColor());
    };

    // Listen for color scheme changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', updateParticleColor);

    // Observer for class changes on html element
    const htmlElement = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          updateParticleColor();
        }
      });
    });

    observer.observe(htmlElement, { attributes: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      darkModeMediaQuery.removeEventListener('change', updateParticleColor);
      observer.disconnect();
      
      // Clean up THREE.js resources
      scene.remove(particlesMesh);
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [isVisible]);

  return (
    <div className="w-full max-w-full min-h-screen bg-transparent color-primary overflow-x-hidden relative">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-[-1]"
      ></canvas>
      <FloatingElements />
      <div className="w-full max-w-7xl mx-auto px-6 space-y-50 pb-100">
        <Navbar />
        <Hero />
        <Features />
        <DemoSection />
        <CTASection />
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
