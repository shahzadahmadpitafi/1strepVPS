import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface AvatarRendererProps {
  measurements: {
    heightCm?: number;
    chestCm?: number;
    waistCm?: number;
    hipsCm?: number;
    shoulderWidthCm?: number;
  };
  garmentColor?: string;
  garmentType?: "tshirt" | "leggings" | "jacket" | "sportsbra";
  rotation?: number;
}

export function AvatarRenderer({
  measurements,
  garmentColor = "#1a1a1a",
  garmentType = "tshirt",
  rotation = 0,
}: AvatarRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Convert measurements to scale factors (normalized around 175cm height)
  const getScaleFactor = () => {
    const baseHeight = 175;
    const actualHeight = measurements.heightCm || baseHeight;
    return actualHeight / baseHeight;
  };

  const getChestScale = () => {
    const baseChest = 96;
    const actualChest = measurements.chestCm || baseChest;
    return actualChest / baseChest;
  };

  const getWaistScale = () => {
    const baseWaist = 81;
    const actualWaist = measurements.waistCm || baseWaist;
    return actualWaist / baseWaist;
  };

  const getHipScale = () => {
    const baseHips = 101;
    const actualHips = measurements.hipsCm || baseHips;
    return actualHips / baseHips;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3.5);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer setup with error handling for WebGL
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
    } catch (error) {
      console.error("WebGL context creation failed:", error);
      setWebglError(true);
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 4, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 2, -2);
    scene.add(fillLight);

    // Create avatar group
    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // Create simple avatar mannequin
    createAvatarMannequin(avatarGroup);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = rotation * (Math.PI / 180);
      }
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !camera || !renderer) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Update avatar when measurements change
  useEffect(() => {
    if (avatarGroupRef.current) {
      updateAvatarScale();
    }
  }, [measurements]);

  // Update garment when color or type changes
  useEffect(() => {
    if (garmentMeshRef.current && avatarGroupRef.current) {
      updateGarment();
    }
  }, [garmentColor, garmentType]);

  // Update rotation
  useEffect(() => {
    if (avatarGroupRef.current) {
      avatarGroupRef.current.rotation.y = rotation * (Math.PI / 180);
    }
  }, [rotation]);

  const createAvatarMannequin = (group: THREE.Group) => {
    const scaleFactor = getScaleFactor();
    const chestScale = getChestScale();
    const waistScale = getWaistScale();
    const hipScale = getHipScale();

    // Mannequin material (light skin tone)
    const mannequinMaterial = new THREE.MeshPhongMaterial({
      color: 0xf5deb3,
      shininess: 5,
    });

    // Head
    const headGeometry = new THREE.SphereGeometry(0.12 * chestScale, 16, 16);
    const head = new THREE.Mesh(headGeometry, mannequinMaterial);
    head.position.y = 1.65 * scaleFactor;
    head.castShadow = true;
    group.add(head);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(
      0.05 * chestScale,
      0.06 * chestScale,
      0.12 * scaleFactor,
      12
    );
    const neck = new THREE.Mesh(neckGeometry, mannequinMaterial);
    neck.position.y = 1.51 * scaleFactor;
    neck.castShadow = true;
    group.add(neck);

    // Upper torso (chest)
    const upperTorsoGeometry = new THREE.CylinderGeometry(
      0.14 * chestScale,
      0.12 * waistScale,
      0.35 * scaleFactor,
      16
    );
    const upperTorso = new THREE.Mesh(upperTorsoGeometry, mannequinMaterial);
    upperTorso.position.y = 1.25 * scaleFactor;
    upperTorso.castShadow = true;
    group.add(upperTorso);

    // Lower torso (waist/hips)
    const lowerTorsoGeometry = new THREE.CylinderGeometry(
      0.12 * waistScale,
      0.13 * hipScale,
      0.25 * scaleFactor,
      16
    );
    const lowerTorso = new THREE.Mesh(lowerTorsoGeometry, mannequinMaterial);
    lowerTorso.position.y = 0.95 * scaleFactor;
    lowerTorso.castShadow = true;
    group.add(lowerTorso);

    // Shoulders (left and right)
    const shoulderGeometry = new THREE.SphereGeometry(0.07 * chestScale, 12, 12);
    const leftShoulder = new THREE.Mesh(shoulderGeometry, mannequinMaterial);
    leftShoulder.position.set(-0.16 * chestScale, 1.4 * scaleFactor, 0);
    leftShoulder.castShadow = true;
    group.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeometry, mannequinMaterial);
    rightShoulder.position.set(0.16 * chestScale, 1.4 * scaleFactor, 0);
    rightShoulder.castShadow = true;
    group.add(rightShoulder);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(
      0.04 * chestScale,
      0.035 * chestScale,
      0.55 * scaleFactor,
      12
    );
    const leftArm = new THREE.Mesh(armGeometry, mannequinMaterial);
    leftArm.position.set(-0.16 * chestScale, 1.05 * scaleFactor, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, mannequinMaterial);
    rightArm.position.set(0.16 * chestScale, 1.05 * scaleFactor, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(
      0.06 * hipScale,
      0.05 * hipScale,
      0.8 * scaleFactor,
      12
    );
    const leftLeg = new THREE.Mesh(legGeometry, mannequinMaterial);
    leftLeg.position.set(-0.06 * hipScale, 0.4 * scaleFactor, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, mannequinMaterial);
    rightLeg.position.set(0.06 * hipScale, 0.4 * scaleFactor, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Add garment overlay
    createGarment(group, garmentType, garmentColor);
  };

  const createGarment = (group: THREE.Group, type: string, color: string) => {
    const scaleFactor = getScaleFactor();
    const chestScale = getChestScale();
    const waistScale = getWaistScale();
    const hipScale = getHipScale();

    // Remove old garment if exists
    if (garmentMeshRef.current) {
      group.remove(garmentMeshRef.current);
    }

    // Garment material
    const garmentMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 30,
      transparent: true,
      opacity: 0.95,
    });

    let garment: THREE.Mesh;

    switch (type) {
      case "tshirt": {
        const tshirtGeometry = new THREE.CylinderGeometry(
          0.145 * chestScale,
          0.125 * waistScale,
          0.4 * scaleFactor,
          16
        );
        garment = new THREE.Mesh(tshirtGeometry, garmentMaterial);
        garment.position.y = 1.23 * scaleFactor;
        break;
      }
      case "leggings": {
        const leggingsGeometry = new THREE.CylinderGeometry(
          0.065 * hipScale,
          0.055 * hipScale,
          0.85 * scaleFactor,
          12
        );
        garment = new THREE.Mesh(leggingsGeometry, garmentMaterial);
        garment.position.y = 0.42 * scaleFactor;
        break;
      }
      case "jacket": {
        const jacketGeometry = new THREE.CylinderGeometry(
          0.15 * chestScale,
          0.13 * waistScale,
          0.45 * scaleFactor,
          16
        );
        garment = new THREE.Mesh(jacketGeometry, garmentMaterial);
        garment.position.y = 1.22 * scaleFactor;
        break;
      }
      case "sportsbra": {
        const braGeometry = new THREE.CylinderGeometry(
          0.14 * chestScale,
          0.135 * chestScale,
          0.15 * scaleFactor,
          16
        );
        garment = new THREE.Mesh(braGeometry, garmentMaterial);
        garment.position.y = 1.35 * scaleFactor;
        break;
      }
      default:
        garment = new THREE.Mesh(new THREE.BoxGeometry(0, 0, 0), garmentMaterial);
    }

    garment.castShadow = true;
    garment.receiveShadow = true;
    garmentMeshRef.current = garment;
    group.add(garment);
  };

  const updateAvatarScale = () => {
    if (avatarGroupRef.current && sceneRef.current) {
      // Clear and recreate avatar with new measurements
      avatarGroupRef.current.clear();
      createAvatarMannequin(avatarGroupRef.current);
    }
  };

  const updateGarment = () => {
    if (avatarGroupRef.current) {
      createGarment(avatarGroupRef.current, garmentType, garmentColor);
    }
  };

  if (webglError) {
    return (
      <div 
        className="w-full h-full rounded-lg bg-muted flex items-center justify-center p-8 text-center"
        style={{ minHeight: "400px" }}
        data-testid="webgl-error-fallback"
      >
        <div className="space-y-4">
          <div className="text-lg font-semibold">Virtual Try-On Preview Unavailable</div>
          <p className="text-sm text-muted-foreground max-w-md">
            Your device or browser doesn't support 3D rendering (WebGL). 
            Your measurements have been saved successfully and will be used for size recommendations.
          </p>
          <p className="text-xs text-muted-foreground">
            Try using a modern browser like Chrome, Firefox, Safari, or Edge for the full 3D experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: "400px" }}
      data-testid="canvas-avatar-renderer"
    />
  );
}
