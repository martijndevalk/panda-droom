import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWebHaptics } from 'web-haptics/react';
import { playTickSound } from '../../lib/audio';

export interface ClockFaceProps {
  hours: number; // 1-12
  minutes: number; // 0-59
  interactive?: boolean;
  onChange?: (hours: number, minutes: number) => void;
  showHelperZones?: boolean; // Show green "OVER" and orange "VOOR" zones
  showMinuteNumbers?: boolean; // Show 5, 10, 15... outer labels
  highlightSector?: 'none' | 'quarter-over' | 'quarter-before' | 'half';
  size?: number | string;
  className?: string;
}

export const ClockFace: React.FC<ClockFaceProps> = ({
  hours,
  minutes,
  interactive = false,
  onChange,
  showHelperZones = true,
  showMinuteNumbers = false, // Keep clean by default to avoid clutter
  highlightSector = 'none',
  size = '100%',
  className = '',
}) => {
  const { trigger } = useWebHaptics();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeHand, setActiveHand] = useState<'hour' | 'minute' | null>(null);

  // Normalize hour (1-12)
  const normHour = ((hours - 1) % 12) + 1;
  const normMinute = ((minutes % 60) + 60) % 60;

  // Calculate angles (in degrees, 0 = 12 o'clock)
  const minuteAngle = normMinute * 6; // 360 / 60
  const hourAngle = ((normHour % 12) + normMinute / 60) * 30; // 360 / 12

  const lastMinuteRef = useRef(normMinute);
  const lastHourRef = useRef(normHour);

  useEffect(() => {
    lastMinuteRef.current = normMinute;
    lastHourRef.current = normHour;
  }, [normMinute, normHour]);

  // Center & radius in SVG coordinates (320x320 viewBox)
  const cx = 160;
  const cy = 160;
  const r = 136;

  // Helper to convert event to angle from center (in degrees, 0 at top)
  const getAngleFromEvent = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const centerScreenX = rect.left + rect.width / 2;
    const centerScreenY = rect.top + rect.height / 2;
    const dx = clientX - centerScreenX;
    const dy = clientY - centerScreenY;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive || !onChange) return;
    svgRef.current?.setPointerCapture?.(e.pointerId);

    const angle = getAngleFromEvent(e);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) / (rect.width / 2);

      if (dist < 0.52) {
        setActiveHand('hour');
        trigger('nudge');
        playTickSound();
        const h = Math.round(angle / 30) % 12 || 12;
        lastHourRef.current = h;
        if (h !== normHour) {
          onChange(h, normMinute);
        }
      } else {
        setActiveHand('minute');
        trigger('nudge');
        playTickSound();
        const rawM = Math.round(angle / 6) % 60;
        const snapM = (Math.round(rawM / 5) * 5) % 60;
        lastMinuteRef.current = snapM;
        if (snapM !== normMinute) {
          onChange(normHour, snapM);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactive || !onChange || !activeHand) return;
    const angle = getAngleFromEvent(e);

    if (activeHand === 'minute') {
      const rawM = Math.round(angle / 6) % 60;
      const snapM = (Math.round(rawM / 5) * 5) % 60;
      if (snapM !== lastMinuteRef.current) {
        lastMinuteRef.current = snapM;
        trigger('nudge');
        playTickSound();
        onChange(normHour, snapM);
      }
    } else if (activeHand === 'hour') {
      const h = Math.round(angle / 30) % 12 || 12;
      if (h !== lastHourRef.current) {
        lastHourRef.current = h;
        trigger('nudge');
        playTickSound();
        onChange(h, normMinute);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHand) {
      setActiveHand(null);
      svgRef.current?.releasePointerCapture?.(e.pointerId);
    }
  };

  // Numbers 1-12 coordinates placed cleanly with proper radius
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
    const angle = (n * 30 - 90) * (Math.PI / 180);
    const numR = 96;
    return {
      num: n,
      x: cx + numR * Math.cos(angle),
      y: cy + numR * Math.sin(angle),
    };
  });

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, maxWidth: '320px', aspectRatio: '1/1' }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 320 320"
        className={`w-full h-full drop-shadow-xl touch-none ${
          interactive ? (activeHand ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        style={{ cursor: interactive ? (activeHand ? 'grabbing' : 'grab') : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <radialGradient id="clockBezel" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#FFF8E7" />
            <stop offset="98%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFA000" />
          </radialGradient>

          <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.25" />
          </filter>

          <filter id="clockPlateShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2D3436" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Outer Rim */}
        <circle cx={cx} cy={cy} r="154" fill="#F59E0B" stroke="#B45309" strokeWidth="6" />
        <circle cx={cx} cy={cy} r="146" fill="url(#clockBezel)" />

        {/* Inner Clock Face Background */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="3"
          filter="url(#clockPlateShadow)"
        />

        {/* Helper Zones: Over (Right green) & Voor (Left orange) */}
        {showHelperZones && (
          <g opacity="0.12">
            {/* OVER hemisphere (right: 0 to 180 deg) */}
            <path
              d={`M ${cx} ${cy - r + 8} A ${r - 8} ${r - 8} 0 0 1 ${cx} ${cy + r - 8} Z`}
              fill="#10B981"
            />
            {/* VOOR hemisphere (left: 180 to 360 deg) */}
            <path
              d={`M ${cx} ${cy + r - 8} A ${r - 8} ${r - 8} 0 0 1 ${cx} ${cy - r + 8} Z`}
              fill="#F97316"
            />
          </g>
        )}

        {/* Sector Highlights for CPA Intro & Visual Help (Soft background fills, no hard lines) */}
        {highlightSector === 'half' && (
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - r + 8} A ${r - 8} ${r - 8} 0 0 1 ${cx} ${cy + r - 8} Z`}
            fill="#3B82F6"
            fillOpacity="0.22"
          />
        )}
        {highlightSector === 'quarter-over' && (
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - r + 8} A ${r - 8} ${r - 8} 0 0 1 ${cx + r - 8} ${cy} Z`}
            fill="#10B981"
            fillOpacity="0.25"
          />
        )}
        {highlightSector === 'quarter-before' && (
          <path
            d={`M ${cx} ${cy} L ${cx - r + 8} ${cy} A ${r - 8} ${r - 8} 0 0 1 ${cx} ${cy - r + 8} Z`}
            fill="#F97316"
            fillOpacity="0.25"
          />
        )}

        {/* Zone Labels: OVER & VOOR placed in the clear inner quadrant (away from all numbers) */}
        {showHelperZones && (
          <g className="font-extrabold select-none pointer-events-none" opacity="0.35">
            <text x={cx + 46} y={cy - 20} fill="#059669" fontSize="13" textAnchor="middle" fontWeight="900" letterSpacing="0.05em">
              OVER
            </text>
            <text x={cx - 46} y={cy - 20} fill="#EA580C" fontSize="13" textAnchor="middle" fontWeight="900" letterSpacing="0.05em">
              VOOR
            </text>
          </g>
        )}

        {/* 60 Minute tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const isFiveMin = i % 5 === 0;
          const isQuarter = i % 15 === 0;
          const tickAngle = (i * 6 - 90) * (Math.PI / 180);
          const outerR = r - 4;
          const innerR = isQuarter ? r - 16 : isFiveMin ? r - 12 : r - 7;
          const strokeW = isQuarter ? 3.5 : isFiveMin ? 2.5 : 1.2;
          const strokeColor = isQuarter ? '#1F2937' : isFiveMin ? '#4B5563' : '#D1D5DB';

          return (
            <line
              key={`tick-${i}`}
              x1={cx + outerR * Math.cos(tickAngle)}
              y1={cy + outerR * Math.sin(tickAngle)}
              x2={cx + innerR * Math.cos(tickAngle)}
              y2={cy + innerR * Math.sin(tickAngle)}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour Numbers 1-12 (Large, Clear, Beautiful) */}
        {numbers.map(({ num, x, y }) => {
          return (
            <text
              key={`num-${num}`}
              x={x}
              y={y + 7}
              textAnchor="middle"
              fontSize="21"
              fontWeight="900"
              fill="#1F2937"
              className="select-none pointer-events-none"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {num}
            </text>
          );
        })}

        {/* ── MINUTE HAND (Blue / Cyan, Long & Sleek) ── */}
        <g
          transform={`rotate(${minuteAngle} ${cx} ${cy})`}
          filter="url(#handShadow)"
          className="transition-transform duration-100 ease-out"
        >
          {/* Unified minute hand body + pointer */}
          <path
            d={`
              M ${cx - 3} ${cy + 18}
              A 3 3 0 0 1 ${cx + 3} ${cy + 18}
              L ${cx + 3.5} ${cy}
              L ${cx + 2.5} ${cy - 88}
              L ${cx + 5.5} ${cy - 88}
              L ${cx} ${cy - 110}
              L ${cx - 5.5} ${cy - 88}
              L ${cx - 2.5} ${cy - 88}
              L ${cx - 3.5} ${cy}
              Z
            `}
            fill="#0EA5E9"
            stroke="#0369A1"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner highlight line */}
          <line x1={cx} y1={cy - 10} x2={cx} y2={cy - 86} stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ── HOUR HAND (Red / Coral, Short & Bold - On Top) ── */}
        <g
          transform={`rotate(${hourAngle} ${cx} ${cy})`}
          filter="url(#handShadow)"
          className="transition-transform duration-100 ease-out"
        >
          {/* Unified hour hand body + pointer */}
          <path
            d={`
              M ${cx - 4.5} ${cy + 14}
              A 4.5 4.5 0 0 1 ${cx + 4.5} ${cy + 14}
              L ${cx + 5} ${cy}
              L ${cx + 3.5} ${cy - 52}
              L ${cx + 7} ${cy - 52}
              L ${cx} ${cy - 74}
              L ${cx - 7} ${cy - 52}
              L ${cx - 3.5} ${cy - 52}
              L ${cx - 5} ${cy}
              Z
            `}
            fill="#EF4444"
            stroke="#991B1B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner highlight line */}
          <line x1={cx} y1={cy - 10} x2={cx} y2={cy - 50} stroke="#FCA5A5" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Center Cap Pin */}
        <circle cx={cx} cy={cy} r="9.5" fill="#F59E0B" stroke="#92400E" strokeWidth="3" filter="url(#handShadow)" />
        <circle cx={cx - 2} cy={cy - 2} r="3" fill="#FFFFFF" opacity="0.8" />
      </svg>
    </div>
  );
};
