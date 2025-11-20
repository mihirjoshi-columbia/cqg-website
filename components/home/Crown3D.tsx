"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Crown3D() {
    const pointsRef = useRef<THREE.Points>(null);

    // Generate points for a crown shape
    const particlesPosition = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Base ring
            const angle = (i / count) * Math.PI * 2 * 3; // Wrap around multiple times for density
            const radius = 2;

            // Create spikes
            const spikeCount = 5;
            const spikeHeight = Math.sin(angle * spikeCount) > 0 ? Math.sin(angle * spikeCount) * 1.5 : 0;

            // Add some randomness/thickness
            const r = radius + (Math.random() - 0.5) * 0.2;
            const h = (Math.random() * 1) + spikeHeight; // Base height + spike

            const x = r * Math.cos(angle);
            const z = r * Math.sin(angle);
            const y = h - 1; // Center vertically

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        return positions;
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        // Slow rotation
        pointsRef.current.rotation.y += 0.002;

        // Parallax effect based on mouse position
        const { mouse } = state;
        pointsRef.current.rotation.x = mouse.y * 0.2;
        pointsRef.current.rotation.z = mouse.x * 0.2;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                    args={[particlesPosition, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#B9D9EB"
                sizeAttenuation={true}
                transparent={true}
                opacity={0.8}
            />
        </points>
    );
}
