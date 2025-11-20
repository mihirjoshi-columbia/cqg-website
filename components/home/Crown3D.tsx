"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Crown3D() {
    const pointsRef = useRef<THREE.Points>(null);

    // Generate points for a crown shape resembling the Columbia University crown
    const particlesPosition = useMemo(() => {
        const points: number[] = [];
        const addPoint = (x: number, y: number, z: number) => {
            points.push(x, y, z);
        };

        const R = 2; // Radius of the base
        const BaseH = -1.5; // Base height offset to center the model
        const RimH = 0.8; // Height of the rim decorations
        const ArchH = 2.5; // Peak height of the arches

        // 1. Base Circlet (Dense Ring)
        for (let i = 0; i < 800; i++) {
            const angle = (i / 800) * Math.PI * 2;
            // Add some thickness and height variation for a band look
            const r = R + (Math.random() - 0.5) * 0.1;
            const y = BaseH + Math.random() * 0.4;
            addPoint(r * Math.cos(angle), y, r * Math.sin(angle));
        }

        // 2. Rim Decorations (8 peaks: 4 Crosses, 4 Fleurs-de-lis)
        // Modeled as a continuous wave with 8 peaks
        for (let i = 0; i < 1500; i++) {
            const angle = (i / 1500) * Math.PI * 2;

            // Create 8 peaks (alternating slightly in shape if we wanted, but uniform is fine for abstract)
            // cos(4 * angle) gives 4 peaks. abs(cos(4*angle)) gives 8 peaks.
            // We want peaks at 0, 45, 90...
            const wave = Math.abs(Math.cos(4 * angle));

            // Height at this angle
            const h = BaseH + 0.4 + (wave * RimH);

            // Fill the shape downwards to the base band
            const y = BaseH + 0.4 + Math.random() * (h - (BaseH + 0.4));

            // Add some thickness
            const r = R + (Math.random() - 0.5) * 0.1;

            addPoint(r * Math.cos(angle), y, r * Math.sin(angle));

            // Add extra density at the tips of the peaks (jewels/finials)
            if (y > BaseH + 0.4 + RimH * 0.8) {
                addPoint(r * Math.cos(angle), y, r * Math.sin(angle));
            }
        }

        // 3. Arches (Two crossing arches)
        // Arch 1: Along X-axis
        for (let i = 0; i < 600; i++) {
            const t = (i / 600) * Math.PI; // 0 to pi
            const x = R * Math.cos(t);
            // Arch shape: starts at rim height, peaks at center
            const y = BaseH + 0.4 + (ArchH * Math.sin(t));

            const rOffset = (Math.random() - 0.5) * 0.15;
            addPoint(x, y + rOffset, 0 + rOffset);
        }

        // Arch 2: Along Z-axis
        for (let i = 0; i < 600; i++) {
            const t = (i / 600) * Math.PI;
            const z = R * Math.cos(t);
            const y = BaseH + 0.4 + (ArchH * Math.sin(t));

            const rOffset = (Math.random() - 0.5) * 0.15;
            addPoint(0 + rOffset, y + rOffset, z);
        }

        // 4. Top Monde & Cross
        const TopY = BaseH + 0.4 + ArchH;

        // Monde (Sphere)
        for (let i = 0; i < 300; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = 0.25 * Math.cbrt(Math.random());

            const sx = r * Math.sin(phi) * Math.cos(theta);
            const sy = r * Math.sin(phi) * Math.sin(theta);
            const sz = r * Math.cos(phi);

            addPoint(sx, TopY + sy, sz);
        }

        // Cross
        const CrossH = 0.5;
        const CrossW = 0.3;
        const CrossY = TopY + 0.25; // Start on top of sphere

        // Vertical bar
        for (let i = 0; i < 150; i++) {
            const h = Math.random() * CrossH;
            const w = (Math.random() - 0.5) * 0.05;
            addPoint(w, CrossY + h, w);
        }
        // Horizontal bar
        for (let i = 0; i < 100; i++) {
            const w = (Math.random() - 0.5) * CrossW;
            const h = (Math.random() - 0.5) * 0.05;
            addPoint(w, CrossY + CrossH * 0.6 + h, 0);
        }

        return new Float32Array(points);
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        // Slow rotation
        pointsRef.current.rotation.y += 0.002;

        // Parallax effect based on mouse position
        const { mouse } = state;
        // Gentle tilt
        pointsRef.current.rotation.x = mouse.y * 0.1;
        pointsRef.current.rotation.z = mouse.x * 0.1;
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
                size={0.04}
                color="#B9D9EB"
                sizeAttenuation={true}
                transparent={true}
                opacity={0.8}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
