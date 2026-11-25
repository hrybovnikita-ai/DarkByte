import type { WorldSceneId } from "@/config/worlds";

type Props = {
  scene: WorldSceneId;
  className?: string;
};

export default function WorldPixelScenes({ scene, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 640 400"
      className={`pixel-image h-full w-full ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${scene} pixel art environment`}
    >
      {scene === "ocean" && <OceanScene />}
      {scene === "cyber" && <CyberScene />}
      {scene === "forest" && <ForestScene />}
      {scene === "inferno" && <InfernoScene />}
      {scene === "golden" && <GoldenScene />}
      {scene === "terminal" && <TerminalScene />}
      {scene === "frozen" && <FrozenScene />}
      {scene === "arcade" && <ArcadeScene />}
    </svg>
  );
}

function OceanScene() {
  const water = "#042a4a";
  const deep = "#021525";
  const cyan = "#00BFFF";
  const ice = "#E0F7FF";
  return (
    <>
      <rect width="640" height="400" fill={deep} />
      <rect width="640" height="140" fill="#05335a" opacity="0.9" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={`ray-${i}`}
          x={60 + i * 80}
          y={0}
          width={8 + (i % 3) * 4}
          height={220}
          fill={ice}
          opacity={0.06 + (i % 4) * 0.02}
        />
      ))}
      <rect y="95" width="640" height="305" fill={water} />
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={`bubble-${i}`}
          cx={(i * 97 + 20) % 620}
          cy={160 + ((i * 43) % 200)}
          r={2 + (i % 3)}
          fill={cyan}
          opacity={0.35}
        />
      ))}
      {[80, 200, 360, 500].map((x) => (
        <g key={x}>
          <rect x={x} y={120} width={20} height={180} fill="#1a4a6a" />
          <rect x={x - 10} y={100} width={40} height={24} fill="#2a6a8a" />
          <rect x={x + 4} y={80} width={12} height={24} fill="#1a4a6a" />
        </g>
      ))}
      <rect x="240" y="150" width="160" height="100" fill="#123a55" />
      <rect x="255" y="165" width="30" height="50" fill="#081820" />
      <rect x="355" y="165" width="30" height="50" fill="#081820" />
      <rect x="280" y="130" width="80" height="20" fill="#1a4a6a" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={`fish-${i}`}
          x={100 + i * 40}
          y={200 + (i % 3) * 30}
          width="16"
          height="8"
          fill={i % 2 ? cyan : "#2080b0"}
        />
      ))}
      <ellipse cx="480" cy="260" rx="70" ry="40" fill="#0a3050" />
      <rect x="430" y="250" width="100" height="8" fill={cyan} opacity="0.5" />
      <rect x="0" y="340" width="640" height="60" fill="#031018" />
    </>
  );
}

function CyberScene() {
  const sky = "#0a0618";
  const blue = "#2563FF";
  const purple = "#9333EA";
  const violet = "#8B5CF6";
  return (
    <>
      <rect width="640" height="400" fill={sky} />
      {Array.from({ length: 50 }, (_, i) => (
        <rect
          key={`star-${i}`}
          x={(i * 53 + 11) % 640}
          y={(i * 31 + 7) % 120}
          width="2"
          height="2"
          fill={violet}
          opacity={0.35}
        />
      ))}
      <rect y="300" width="640" height="100" fill="#120a22" />
      {[
        { x: 40, h: 200, w: 50 },
        { x: 110, h: 260, w: 70 },
        { x: 200, h: 180, w: 45 },
        { x: 270, h: 290, w: 85 },
        { x: 380, h: 220, w: 60 },
        { x: 460, h: 270, w: 75 },
        { x: 550, h: 190, w: 55 },
      ].map((b) => (
        <g key={b.x}>
          <rect
            x={b.x}
            y={400 - b.h}
            width={b.w}
            height={b.h}
            fill="#1a1030"
          />
          <rect
            x={b.x + 8}
            y={400 - b.h + 20}
            width={b.w - 16}
            height="8"
            fill={blue}
            opacity="0.7"
          />
          <rect
            x={b.x + 8}
            y={400 - b.h + 40}
            width={b.w - 16}
            height="6"
            fill={purple}
            opacity="0.6"
          />
          {Array.from({ length: Math.floor(b.h / 35) }, (_, i) => (
            <rect
              key={i}
              x={b.x + (i % 2) * (b.w - 12)}
              y={400 - b.h + 60 + i * 28}
              width="10"
              height="14"
              fill="#0d0820"
            />
          ))}
        </g>
      ))}
      <rect x="140" y="320" width="360" height="4" fill={violet} opacity="0.5" />
      <rect x="280" y="250" width="80" height="120" fill="#050510" opacity="0.6" />
      {Array.from({ length: 20 }, (_, i) => (
        <rect
          key={`bit-${i}`}
          x={(i * 97) % 600}
          y={140 + (i % 5) * 25}
          width="4"
          height="4"
          fill={blue}
          opacity={0.5}
        />
      ))}
    </>
  );
}

function ForestScene() {
  const ground = "#0f1a12";
  const trunk = "#1a2f1f";
  const green = "#10B981";
  return (
    <>
      <rect width="640" height="400" fill="#050a08" />
      <rect y="280" width="640" height="120" fill={ground} />
      {Array.from({ length: 14 }, (_, i) => (
        <g key={i}>
          <rect
            x={i * 48 - 10}
            y={120 + (i % 4) * 20}
            width="16"
            height="200"
            fill={trunk}
          />
          <rect
            x={i * 48 - 30}
            y={90 + (i % 4) * 25}
            width="56"
            height="24"
            fill={i % 2 ? "#14532d" : "#166534"}
          />
          <rect
            x={i * 48 - 20}
            y={110 + (i % 4) * 20}
            width="36"
            height="16"
            fill={green}
            opacity="0.5"
          />
        </g>
      ))}
      <rect x="220" y="200" width="200" height="100" fill="#101810" />
      <path
        d="M220 200 H420 V260 H380 V200 H320 V180 H300 V200 H260 V220 H220 Z"
        fill="#181818"
      />
      <rect x="295" y="230" width="50" height="70" fill="#040504" />
      <rect x="310" y="245" width="8" height="8" fill={green} opacity="0.8" />
      <rect x="330" y="245" width="8" height="8" fill={green} opacity="0.8" />
      {Array.from({ length: 25 }, (_, i) => (
        <rect
          key={`fog-${i}`}
          x={(i * 73) % 640}
          y={250 + (i % 4) * 12}
          width={40 + (i % 3) * 20}
          height="6"
          fill={green}
          opacity={0.08}
        />
      ))}
    </>
  );
}

function InfernoScene() {
  const red = "#FF003C";
  const lava = "#FF4500";
  const orange = "#FF8800";
  return (
    <>
      <rect width="640" height="400" fill="#1a0508" />
      <rect y="250" width="640" height="150" fill="#2a0a05" />
      <polygon points="200,250 320,80 440,250" fill="#4a1010" />
      <polygon points="230,250 320,120 410,250" fill="#6a1810" />
      <polygon points="280,250 320,160 360,250" fill={red} opacity="0.8" />
      {Array.from({ length: 15 }, (_, i) => (
        <rect
          key={`ember-${i}`}
          x={150 + ((i * 67) % 340)}
          y={100 + (i % 5) * 25}
          width="4"
          height="4"
          fill={orange}
          opacity={0.7}
        />
      ))}
      <rect y="300" width="640" height="20" fill={lava} />
      <rect y="320" width="640" height="8" fill={orange} opacity="0.8" />
      <rect x="450" y="170" width="120" height="140" fill="#201010" />
      {[0, 30, 60].map((o) => (
        <rect key={o} x={450 + o} y={150 - o / 3} width={30} height={25} fill="#2a1515" />
      ))}
      <rect x="480" y="230" width="24" height="50" fill="#080404" />
    </>
  );
}

function GoldenScene() {
  const gold = "#FFD700";
  const yellow = "#FFDD00";
  return (
    <>
      <rect width="640" height="400" fill="#120c04" />
      <rect y="300" width="640" height="100" fill="#1a1006" />
      {[120, 280, 440].map((x) => (
        <g key={x}>
          <rect x={x} y={80} width="80" height="220" fill="#2a2010" />
          <path
            d={`M${x} 80 H${x + 80} L${x + 40} 40 Z`}
            fill="#3a2818"
          />
          <rect x={x + 30} y={140} width="20" height="80" fill="#0a0804" />
        </g>
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <rect
          key={`coin-${i}`}
          x={80 + ((i * 47) % 480)}
          y={310 + (i % 4) * 8}
          width="12"
          height="8"
          fill={i % 2 ? gold : yellow}
        />
      ))}
      <circle cx="320" cy="200" r="50" fill={gold} opacity="0.9" />
      <circle cx="320" cy="200" r="35" fill={yellow} />
      <rect x="305" y="185" width="30" height="30" fill="#8a7000" opacity="0.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={`spark-${i}`}
          x={(i * 113) % 600}
          y={60 + (i % 6) * 40}
          width="3"
          height="3"
          fill={gold}
          opacity="0.8"
        />
      ))}
    </>
  );
}

function TerminalScene() {
  const lime = "#BFFF00";
  return (
    <>
      <rect width="640" height="400" fill="#060606" />
      <rect x="60" y="50" width="520" height="300" fill="#151515" />
      <rect x="72" y="64" width="496" height="260" fill="#030303" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect
          key={`line-${i}`}
          x={90}
          y={80 + i * 13}
          width={120 + ((i * 67) % 300)}
          height="6"
          fill={lime}
          opacity={0.35 + (i % 4) * 0.1}
        />
      ))}
      <rect x="90" y={80 + 18 * 13} width="12" height="14" fill={lime} className="crt-cursor" />
      <rect x="250" y="330" width="140" height="12" fill="#333" />
      <rect x="220" y="350" width="200" height="8" fill="#222" />
      <rect
        x="60"
        y="50"
        width="520"
        height="300"
        fill="none"
        stroke={lime}
        strokeWidth="2"
        opacity="0.3"
      />
    </>
  );
}

function FrozenScene() {
  const ice = "#E0F7FF";
  const blue = "#2563FF";
  return (
    <>
      <rect width="640" height="400" fill="#040818" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={`aurora-${i}`}
          x={80 + i * 100}
          y={20}
          width="120"
          height="8"
          fill={i % 2 ? "#10B981" : "#8B5CF6"}
          opacity={0.35}
        />
      ))}
      <polygon points="0,400 0,220 160,180 280,250 400,200 640,260 640,400" fill="#0a1830" />
      <rect x="200" y="120" width="240" height="160" fill="#102040" />
      {[0, 40, 80, 120, 160, 200].map((o) => (
        <polygon
          key={o}
          points={`${220 + o},120 ${240 + o},90 ${260 + o},120`}
          fill="#183050"
        />
      ))}
      <rect x="290" y="200" width="60" height="80" fill="#050a14" />
      {Array.from({ length: 50 }, (_, i) => (
        <rect
          key={`snow-${i}`}
          x={(i * 67) % 640}
          y={(i * 23) % 400}
          width="3"
          height="3"
          fill={ice}
          opacity={0.7}
        />
      ))}
      <rect x="140" y="280" width="360" height="6" fill={blue} opacity="0.4" />
    </>
  );
}

function ArcadeScene() {
  const orange = "#FF8800";
  const purple = "#9333EA";
  const yellow = "#FFDD00";
  return (
    <>
      <rect width="640" height="400" fill="#0a0612" />
      <rect y="320" width="640" height="80" fill="#15101a" />
      {[60, 180, 300, 420].map((x, i) => (
        <g key={x}>
          <rect x={x} y={140} width="100" height="200" fill="#1a1520" />
          <rect
            x={x + 15}
            y={155}
            width="70"
            height="90"
            fill={i % 2 ? "#180830" : "#082018"}
          />
          <rect
            x={x + 25}
            y={170}
            width="50"
            height="6"
            fill={i % 2 ? purple : orange}
          />
          <rect x={x + 35} y={260} width="30" height="40" fill="#2a2030" />
          <circle cx={x + 50} cy={285} r="8" fill={yellow} opacity="0.8" />
        </g>
      ))}
      <rect x="0" y="100" width="640" height="4" fill={purple} opacity="0.5" />
      <rect x="0" y="310" width="640" height="2" fill={orange} opacity="0.5" />
    </>
  );
}