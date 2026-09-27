import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

const HOLO = '#38bdf8'
const HOLO_DIM = '#0ea5e9'
const GOLD = 'var(--seal-on-ink)'

function HoloFloor() {
  return (
    <group position={[0, -0.02, 0]}>
      <gridHelper args={[6, 24, HOLO, HOLO_DIM]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.42, 96]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.85, 96]} />
        <meshBasicMaterial color={HOLO_DIM} transparent opacity={0.045} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Joint({ radius = 0.18 }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 24]} />
      <meshStandardMaterial
        color="#dff8ff"
        emissive={HOLO_DIM}
        emissiveIntensity={0.75}
        metalness={0.25}
        roughness={0.18}
        transparent
        opacity={0.74}
      />
    </mesh>
  )
}

function ArmSegment({ length, radius = 0.105, y = 0 }) {
  return (
    <mesh position={[0, y, 0]}>
      <cylinderGeometry args={[radius, radius, length, 32]} />
      <meshStandardMaterial
        color="#bdefff"
        emissive={HOLO}
        emissiveIntensity={0.5}
        metalness={0.18}
        roughness={0.22}
        transparent
        opacity={0.62}
      />
    </mesh>
  )
}

function WireSegment({ length, y = 0, x = 0.18 }) {
  return (
    <mesh position={[x, y, 0]}>
      <cylinderGeometry args={[0.018, 0.018, length, 12]} />
      <meshBasicMaterial color={GOLD} transparent opacity={0.75} />
    </mesh>
  )
}

function RobotArm({ scrollRef }) {
  const rootRef = useRef(null)
  const shoulderRef = useRef(null)
  const elbowRef = useRef(null)
  const wristRef = useRef(null)
  const leftClawRef = useRef(null)
  const rightClawRef = useRef(null)

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    const pct = scrollRef.current || 0
    const float = Math.sin(elapsed * 1.4) * 0.035
    const scan = Math.sin(elapsed * 2.2) * 0.08

    if (rootRef.current) {
      rootRef.current.rotation.y = -0.45 + pct * 0.95 + scan
      rootRef.current.position.y = float
    }
    if (shoulderRef.current) {
      shoulderRef.current.rotation.z = -0.58 + pct * 0.72 + Math.sin(elapsed * 1.1) * 0.05
    }
    if (elbowRef.current) {
      elbowRef.current.rotation.z = 0.82 - pct * 0.64 + Math.sin(elapsed * 1.7) * 0.05
    }
    if (wristRef.current) {
      wristRef.current.rotation.z = -0.36 + pct * 0.46 + Math.sin(elapsed * 2.6) * 0.06
      wristRef.current.rotation.y = Math.sin(elapsed * 1.3) * 0.12
    }
    if (leftClawRef.current && rightClawRef.current) {
      const claw = 0.24 + Math.sin(elapsed * 2.4) * 0.08
      leftClawRef.current.rotation.z = claw
      rightClawRef.current.rotation.z = -claw
    }
  })

  return (
    <group ref={rootRef} position={[0, 0.05, 0]} rotation={[0, -0.45, 0]}>
      {/* Base */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.72, 0.88, 0.22, 72]} />
        <meshStandardMaterial
          color="#a7eaff"
          emissive={HOLO_DIM}
          emissiveIntensity={0.45}
          metalness={0.22}
          roughness={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.34, 0.44, 0.32, 56]} />
        <meshStandardMaterial
          color="#d7f8ff"
          emissive={HOLO}
          emissiveIntensity={0.45}
          metalness={0.25}
          roughness={0.16}
          transparent
          opacity={0.64}
        />
      </mesh>

      {/* Shoulder and upper arm */}
      <group ref={shoulderRef} position={[0, 0.52, 0]} rotation={[0, 0, -0.58]}>
        <Joint radius={0.25} />
        <ArmSegment length={1.55} y={0.78} />
        <WireSegment length={1.42} y={0.78} x={0.18} />
        <WireSegment length={1.42} y={0.78} x={-0.18} />

        {/* Elbow and lower arm */}
        <group ref={elbowRef} position={[0, 1.58, 0]} rotation={[0, 0, 0.82]}>
          <Joint radius={0.22} />
          <ArmSegment length={1.22} radius={0.095} y={0.62} />
          <WireSegment length={1.08} y={0.62} x={0.16} />

          {/* Wrist and gripper */}
          <group ref={wristRef} position={[0, 1.25, 0]} rotation={[0, 0, -0.36]}>
            <Joint radius={0.17} />
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.5, 0.18, 0.22]} />
              <meshStandardMaterial
                color="#e0fbff"
                emissive={HOLO}
                emissiveIntensity={0.56}
                metalness={0.18}
                roughness={0.2}
                transparent
                opacity={0.66}
              />
            </mesh>
            <group position={[-0.18, 0.46, 0]} ref={leftClawRef}>
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.09, 0.38, 0.12]} />
                <meshStandardMaterial color="#f3feff" emissive={HOLO} emissiveIntensity={0.62} transparent opacity={0.7} />
              </mesh>
            </group>
            <group position={[0.18, 0.46, 0]} ref={rightClawRef}>
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.09, 0.38, 0.12]} />
                <meshStandardMaterial color="#f3feff" emissive={HOLO} emissiveIntensity={0.62} transparent opacity={0.7} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/* ---------- Outer component (canvas + scroll wiring) --------------- */
export default function HoloArm() {
  const scrollRef = useRef(0)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const pct = Math.min(window.scrollY / (window.innerHeight * 0.6), 1)
      scrollRef.current = pct
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trigger re-render once fonts settle so Canvas calculates layout correctly.
  useEffect(() => {
    let cancelled = false
    const ready = typeof document !== 'undefined' && document.fonts?.ready
    if (!ready) {
      setFontsLoaded(true)
      return undefined
    }

    ready.then(() => {
      if (!cancelled) setFontsLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Prevent layout thrashing: render a skeleton block until fonts are ready.
  if (!fontsLoaded) {
    return <div style={{ width: '100%', height: '520px', pointerEvents: 'none' }} />
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '520px',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Scanline sweep — pure CSS for the holo "screen" effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            'linear-gradient(90deg, transparent, rgba(56,189,248,0.8), transparent)',
          animation: 'holoScan 3.5s linear infinite',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      <Canvas
        camera={{ position: [4.8, 3.3, 5.8], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting tuned for the holo cyan look */}
        <ambientLight intensity={0.55} color="#cbe9ff" />
        <directionalLight position={[6, 8, 4]} intensity={0.9} color="#9fd6ff" />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} color={HOLO_DIM} />
        <pointLight position={[0, 4, 0]} intensity={0.6} color={HOLO} distance={10} />

        <HoloFloor />
        <RobotArm scrollRef={scrollRef} />
      </Canvas>

      <style>{`
        @keyframes holoScan {
          0%   { top: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
