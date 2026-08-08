import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PoseLandmark } from '@/hooks/useARCamera';

interface ARGarmentOverlayProps {
  landmarks: PoseLandmark[] | null;
  garmentType: 'tshirt' | 'leggings' | 'jacket' | 'sports-bra' | null;
  garmentColor: string;
  canvasWidth: number;
  canvasHeight: number;
  videoElement: HTMLVideoElement | null;
}

export default function ARGarmentOverlay({
  landmarks,
  garmentType,
  garmentColor,
  canvasWidth,
  canvasHeight,
  videoElement,
}: ARGarmentOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasWidth / canvasHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clean up renderer
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      // Clean up scene and meshes
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [canvasWidth, canvasHeight]);

  // Create/update garment type
  useEffect(() => {
    if (!sceneRef.current) return;

    if (!garmentType) {
      // Remove existing garment if no type selected
      if (garmentMeshRef.current) {
        sceneRef.current.remove(garmentMeshRef.current);
        garmentMeshRef.current.geometry.dispose();
        if (garmentMeshRef.current.material instanceof THREE.Material) {
          garmentMeshRef.current.material.dispose();
        }
        garmentMeshRef.current = null;
      }
      return;
    }

    // Only recreate mesh if garment type changed
    if (!garmentMeshRef.current || garmentMeshRef.current.userData.garmentType !== garmentType) {
      // Remove existing garment
      if (garmentMeshRef.current) {
        sceneRef.current.remove(garmentMeshRef.current);
        garmentMeshRef.current.geometry.dispose();
        if (garmentMeshRef.current.material instanceof THREE.Material) {
          garmentMeshRef.current.material.dispose();
        }
      }

      // Create new garment
      const garmentMesh = createGarment(garmentType, garmentColor);
      if (garmentMesh) {
        garmentMesh.userData.garmentType = garmentType;
        sceneRef.current.add(garmentMesh);
        garmentMeshRef.current = garmentMesh;
      }
    }
  }, [garmentType, garmentColor]);

  // Update garment color (without recreating mesh)
  useEffect(() => {
    if (garmentMeshRef.current && garmentMeshRef.current.material instanceof THREE.MeshPhongMaterial) {
      garmentMeshRef.current.material.color.set(garmentColor);
    }
  }, [garmentColor]);

  // Update garment position based on landmarks (runs every frame)
  useEffect(() => {
    if (garmentMeshRef.current && landmarks) {
      updateGarmentPosition(garmentMeshRef.current, landmarks, canvasWidth, canvasHeight);
    }
  }, [landmarks, canvasWidth, canvasHeight]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}

// Create garment geometry
function createGarment(type: string, color: string): THREE.Mesh | null {
  const colorValue = new THREE.Color(color);
  const material = new THREE.MeshPhongMaterial({
    color: colorValue,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  let geometry: THREE.BufferGeometry;

  switch (type) {
    case 'tshirt':
      // Simple t-shirt shape using box and cylinders
      geometry = new THREE.BoxGeometry(1.2, 1.5, 0.2);
      break;

    case 'leggings':
      // Leggings using cylinder geometry
      geometry = new THREE.CylinderGeometry(0.3, 0.2, 2, 16);
      break;

    case 'jacket':
      // Jacket using box geometry
      geometry = new THREE.BoxGeometry(1.4, 1.6, 0.25);
      break;

    case 'sports-bra':
      // Sports bra using sphere segment
      geometry = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      break;

    default:
      return null;
  }

  return new THREE.Mesh(geometry, material);
}

// Position garment based on body pose landmarks
function updateGarmentPosition(
  mesh: THREE.Mesh | null,
  landmarks: PoseLandmark[],
  width: number,
  height: number
) {
  if (!mesh || !landmarks || landmarks.length < 24) return;

  // Get key body points (MediaPipe landmark indices)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

  // Calculate center point of torso
  const centerX = ((leftShoulder.x + rightShoulder.x) / 2 - 0.5) * 10;
  const centerY = -((leftShoulder.y + rightShoulder.y) / 2 - 0.5) * 10;

  // Calculate shoulder width for scaling
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x) * width;
  const torsoHeight = Math.abs(
    ((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)
  ) * height;

  // Position the garment
  mesh.position.set(centerX, centerY, 0);

  // Scale based on body size
  const scaleX = (shoulderWidth / width) * 15;
  const scaleY = (torsoHeight / height) * 15;
  mesh.scale.set(scaleX, scaleY, 1);

  // Rotate slightly for better fit
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );
  mesh.rotation.z = shoulderAngle;
}
