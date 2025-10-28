'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const ArchitectureSceneClient = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    import('three').then((THREE) => {
      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000)
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(0, 0, 10)

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Grid
      const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x00ffff)
      gridHelper.position.y = -5
      scene.add(gridHelper)

      // Points
      const nodes = [
        { pos: [-6, 2, 0], color: 0x00ffff },
        { pos: [-3, 0, 0], color: 0xff00ff },
        { pos: [0, -2, 0], color: 0xa855f7 },
        { pos: [3, 0, 0], color: 0x00ff88 },
        { pos: [6, 2, 0], color: 0x00ffff }
      ]

      const spheres: THREE.Mesh[] = []
      nodes.forEach(node => {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16)
        const material = new THREE.MeshBasicMaterial({ color: node.color, wireframe: true })
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(node.pos[0], node.pos[1], node.pos[2])
        scene.add(sphere)
        spheres.push(sphere)
      })

      // Connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4]
      ]

      connections.forEach(([i, j]) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...nodes[i].pos as [number, number, number]),
          new THREE.Vector3(...nodes[j].pos as [number, number, number])
        ])
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.3, transparent: true })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
      })

      // Animation
      const animate = () => {
        requestAnimationFrame(animate)
        
        spheres.forEach((sphere, i) => {
          sphere.rotation.x += 0.01
          sphere.rotation.y += 0.01
          sphere.scale.setScalar(1 + Math.sin(Date.now() * 0.001 + i) * 0.1)
        })

        renderer.render(scene, camera)
      }
      animate()

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (rendererRef.current && containerRef.current) {
          const canvas = rendererRef.current.domElement
          if (canvas && containerRef.current.contains(canvas)) {
            containerRef.current.removeChild(canvas)
          }
          rendererRef.current.dispose()
        }
      }
    })
  }, [])

  return (
    <div ref={containerRef} className="w-full h-96 border-2 border-cyan-500/50 rounded-lg overflow-hidden" />
  )
}

// Export dynamic version to avoid SSR issues
export const ArchitectureScene = dynamic(() => Promise.resolve(ArchitectureSceneClient), { ssr: false })