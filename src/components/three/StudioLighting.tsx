type Vec3 = [number, number, number]

/**
 * Photographic studio lighting: a warm shadow-casting key, a cool fill from the
 * opposite side that also rims the figures, and sky/floor bounce. Plain lights
 * keep shader compilation cheap on software WebGL, where an image-based
 * environment map adds seconds to the first frame.
 */
export default function StudioLighting({ keyPosition = [3.5, 7, 4.5], extent = 5, keyIntensity = 2.4 }: {
  keyPosition?: Vec3
  extent?: number
  keyIntensity?: number
}) {
  return <>
    <hemisphereLight args={['#f3f6fa', '#8d8376', 1.5]} />
    <directionalLight
      position={keyPosition}
      intensity={keyIntensity}
      color="#fff3e2"
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-extent}
      shadow-camera-right={extent}
      shadow-camera-top={extent}
      shadow-camera-bottom={-extent}
      shadow-camera-near={0.5}
      shadow-camera-far={30}
      shadow-bias={-0.0002}
      shadow-normalBias={0.025}
      shadow-radius={3}
    />
    <directionalLight position={[-keyPosition[0] * 1.2, keyPosition[1] * 0.55, -keyPosition[2] * 0.6]} intensity={0.75} color="#e9efff" />
  </>
}
