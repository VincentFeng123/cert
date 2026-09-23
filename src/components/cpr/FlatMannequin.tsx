export default function FlatMannequin({ handsPlaced, onActivate, disabled }: {
  handsPlaced: boolean
  onActivate: () => void
  disabled: boolean
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 pt-24 pb-4">
      <div className="relative h-[180px] w-[147px] shrink-0 sm:h-[270px] sm:w-[220px]">
        <svg viewBox="0 0 220 270" className="h-full w-full" role="img" aria-label="Adult CPR mannequin shown from above; the green target marks the center of the chest.">
          <rect x="10" y="6" width="200" height="258" rx="24" fill="#415e65" />
          <path d="M94 85 L94 68 H126 V85 L160 94 Q185 103 181 137 L163 224 Q110 246 57 224 L39 137 Q35 103 60 94 Z" fill="#d9b29b" />
          <ellipse cx="110" cy="49" rx="29" ry="35" fill="#dfbaa4" />
          <path d="M96 46 H104 M116 46 H124 M106 65 H114" stroke="#a17c65" strokeWidth="2" strokeLinecap="round" />
          <circle cx="110" cy="146" r="25" fill="#10b981" fillOpacity=".12" stroke="#059669" strokeWidth="2" />
          {handsPlaced ? <path d="M92 145 Q90 127 105 130 L127 137 Q136 142 127 153 L105 162 Q94 163 92 145Z" fill="#8bbacd" stroke="#5f9cac" /> : <path d="M103 146 H117 M110 139 V153" stroke="#047857" strokeWidth="2" strokeLinecap="round" />}
        </svg>
        {!disabled && <button type="button" onClick={onActivate} className="absolute left-[38%] top-[45%] h-[20%] w-[25%] rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-emerald-500" aria-label={handsPlaced ? 'Tap the chest for one practice compression' : 'Place hands on the chest target'} />}
      </div>
      <p className="mt-3 text-xs text-slate-500">2D mode · 3D is unavailable on this device. All practice controls still work.</p>
    </div>
  )
}
