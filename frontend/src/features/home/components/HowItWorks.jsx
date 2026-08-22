import React, { useState } from 'react';
import processGlobeImg from '../../../assets/process_globe.png';

export default function HowItWorks({ onViewChange }) {
  const [activeStep, setActiveStep] = useState(null);

  const stepsData = [
    {
      id: '01',
      number: '01',
      tag: 'STEP 01',
      title: 'Share Knowledge',
      description:
        'Elders share their life experiences, traditional recipes, sustainable farming techniques, folk stories, and traditional crafts through text, images, videos, or voice recordings.',
      keyHighlight: 'Life experiences, recipes, farming & crafts',
      color: '#FF4D6D',
      gradient: 'from-[#FF4D6D] to-[#FF758F]',
      bgLight: 'bg-rose-50/80',
      borderLight: 'border-rose-200',
      textColor: 'text-[#FF4D6D]',
      shadowColor: 'rgba(255, 77, 109, 0.25)',
      illustration: (
        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
          {/* Head profile with gears / mind & wisdom */}
          <path
            d="M24 7C16.8 7 11 12.8 11 20C11 23.7 12.5 27 15 29.3L15.3 35H26.7L27 30.5C32.9 29 37 23.8 37 17.7C37 11.8 31.2 7 24 7Z"
            stroke="#FF4D6D"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="18" r="3.2" stroke="#FF4D6D" strokeWidth="2" strokeDasharray="2 2" />
          <circle cx="28" cy="22" r="2.8" stroke="#FFA41B" strokeWidth="1.8" strokeDasharray="2 1.5" />
          <path d="M18 39H30M20 43H28" stroke="#FF4D6D" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: '02',
      number: '02',
      tag: 'STEP 02',
      title: 'AI Understands & Verifies',
      description:
        "Setu's AI analyzes the shared knowledge using intelligent search and modern scientific sources. It identifies important information, checks authenticity, and separates traditional practices from potentially inaccurate claims.",
      keyHighlight: 'Intelligent search, authenticity & scientific sources',
      color: '#FF7A1A',
      gradient: 'from-[#FF7A1A] to-[#FFA64D]',
      bgLight: 'bg-orange-50/80',
      borderLight: 'border-orange-200',
      textColor: 'text-[#FF7A1A]',
      shadowColor: 'rgba(255, 122, 26, 0.25)',
      illustration: (
        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
          {/* Magnifying Glass Analyzing Wisdom */}
          <circle cx="20" cy="20" r="13" stroke="#FF7A1A" strokeWidth="3" fill="#FFF7ED" />
          <path d="M30 30L41 41" stroke="#C2410C" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M15 20H25M20 15V25" stroke="#FF7A1A" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="34" cy="13" r="2" fill="#FF7A1A" />
        </svg>
      )
    },
    {
      id: '03',
      number: '03',
      tag: 'STEP 03',
      title: 'Organize & Preserve',
      description:
        'Verified knowledge is converted into structured digital entries with summaries, categories, regional information, and multilingual support, creating a searchable cultural knowledge library.',
      keyHighlight: 'Structured entries, categories & multilingual library',
      color: '#EAB308',
      gradient: 'from-[#EAB308] to-[#FDE047]',
      bgLight: 'bg-amber-50/80',
      borderLight: 'border-amber-200',
      textColor: 'text-amber-600',
      shadowColor: 'rgba(234, 179, 8, 0.25)',
      illustration: (
        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
          {/* Global Structured Knowledge with circulating arrows */}
          <circle cx="24" cy="24" r="15" stroke="#EAB308" strokeWidth="2.6" fill="#FEFCE8" />
          <ellipse cx="24" cy="24" rx="7.5" ry="15" stroke="#EAB308" strokeWidth="2" />
          <path d="M9 24H39" stroke="#EAB308" strokeWidth="2" />
          <path d="M14 7L8 13L14 19" stroke="#CA8A04" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 41L40 35L34 29" stroke="#CA8A04" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: '04',
      number: '04',
      tag: 'STEP 04',
      title: 'Learn & Connect',
      description:
        'Young learners explore verified knowledge, ask questions to the AI, discover cultural practices, request mentorship, and connect with experienced elders to keep traditions alive.',
      keyHighlight: 'AI Q&A, mentorship & connecting with elders',
      color: '#84CC16',
      gradient: 'from-[#84CC16] to-[#BEF264]',
      bgLight: 'bg-lime-50/80',
      borderLight: 'border-lime-200',
      textColor: 'text-lime-600',
      shadowColor: 'rgba(132, 204, 22, 0.25)',
      illustration: (
        <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
          {/* Bar chart with rising growth arrow */}
          <rect x="9" y="30" width="5" height="11" rx="1.5" fill="#BEF264" stroke="#65A30D" strokeWidth="1.6" />
          <rect x="17" y="23" width="5" height="18" rx="1.5" fill="#A3E635" stroke="#65A30D" strokeWidth="1.6" />
          <rect x="25" y="16" width="5" height="25" rx="1.5" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1.6" />
          <rect x="33" y="10" width="5" height="31" rx="1.5" fill="#4D7C0F" stroke="#365314" strokeWidth="1.6" />
          <path d="M7 27L19 16L27 21L39 7M39 7H31M39 7V15" stroke="#16A34A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  // SVG Geometry Dimensions: Expanded paths matching section height
  const viewBoxWidth = 480;
  const viewBoxHeight = 520;
  const cx = 170;
  const cy = 260;
  const outerR = 220;
  const innerR = 105;

  // 4 slices spanning -90deg to +90deg
  const slices = [
    { startAngle: -90, endAngle: -45, midAngle: -67.5, stepIndex: 0 },
    { startAngle: -45, endAngle: 0, midAngle: -22.5, stepIndex: 1 },
    { startAngle: 0, endAngle: 45, midAngle: 22.5, stepIndex: 2 },
    { startAngle: 45, endAngle: 90, midAngle: 67.5, stepIndex: 3 }
  ];

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x, y, innerRadius, outerRadius, startAngle, endAngle) => {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, startAngle);
    const endInner = polarToCartesian(x, y, innerRadius, endAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', startOuter.x, startOuter.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', startInner.x, startInner.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, endInner.x, endInner.y,
      'Z'
    ].join(' ');
  };

  return (
    <section className="w-full py-10 md:py-14 bg-[#f8fafc] relative overflow-hidden transition-colors duration-300">
      
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-rose-100/25 via-orange-100/20 to-amber-100/15 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-6 right-10 w-96 h-96 bg-lime-100/20 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 2xl:px-16 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Process Overview
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            How <span className="bg-gradient-to-r from-brand-primary via-orange-500 to-rose-500 bg-clip-text text-transparent">Setu Works</span>
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-2xl">
            Four simple steps to preserve cultural heritage, verify traditional wisdom, and connect generations.
          </p>
        </div>

        {/* Infographic Main Container: Expanded Full-Width */}
        <div className="w-full relative bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 lg:p-8 xl:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/40">
          
          {/* DESKTOP & TABLET: Large 4-Path Infographic Perfectly Equal to Information Column */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-12 items-center">
            
            {/* Left Column: Enlarged 4-Path Semicircular Dial (5 Cols) */}
            <div className="lg:col-span-5 xl:col-span-5 relative flex items-center justify-center">
              
              {/* Background vertical seam */}
              <div className="absolute left-[170px] top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-slate-200 to-transparent pointer-events-none" />

              <svg
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                className="w-full h-auto max-w-[480px] drop-shadow-md overflow-visible select-none"
              >
                <defs>
                  {/* Gradients */}
                  <linearGradient id="grad-step-0" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF4D6D" />
                    <stop offset="100%" stopColor="#FF758F" />
                  </linearGradient>
                  <linearGradient id="grad-step-1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF7A1A" />
                    <stop offset="100%" stopColor="#FFA64D" />
                  </linearGradient>
                  <linearGradient id="grad-step-2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#FDE047" />
                  </linearGradient>
                  <linearGradient id="grad-step-3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#84CC16" />
                    <stop offset="100%" stopColor="#BEF264" />
                  </linearGradient>

                  {/* Circular Hub Clipping Path for the Globe Image */}
                  <clipPath id="hub-image-clip-lg">
                    <circle cx={cx} cy={cy} r={innerR - 6} />
                  </clipPath>
                </defs>

                {/* Outer Semicircle Track */}
                <path
                  d={describeArc(cx, cy, innerR - 3, outerR + 6, -90, 90)}
                  fill="#F8FAFC"
                  stroke="#E2E8F0"
                  strokeWidth="1.5"
                />

                {/* 4 Enlarged Colored Radial Slices / Paths */}
                {slices.map((slice, idx) => {
                  const step = stepsData[idx];
                  const isHovered = activeStep === idx;
                  const pathData = describeArc(cx, cy, innerR, outerR, slice.startAngle, slice.endAngle);
                  const labelPos = polarToCartesian(cx, cy, (innerR + outerR) / 2 - 24, slice.midAngle);

                  return (
                    <g
                      key={step.id}
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setActiveStep(idx)}
                      onMouseLeave={() => setActiveStep(null)}
                    >
                      {/* Soft light colored ambient halo on hover (No black shadow) */}
                      {isHovered && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke={step.color}
                          strokeWidth="10"
                          opacity="0.35"
                          className="transition-opacity duration-300"
                        />
                      )}

                      {/* Colored Wedge Path */}
                      <path
                        d={pathData}
                        fill={`url(#grad-step-${idx})`}
                        className="transition-all duration-300"
                        style={{
                          opacity: isHovered ? 1 : activeStep !== null ? 0.75 : 0.95
                        }}
                        stroke={isHovered ? step.color : '#FFFFFF'}
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                      />

                      {/* Number Text "01", "02", "03", "04" */}
                      <text
                        x={labelPos.x}
                        y={labelPos.y + 8}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="24"
                        fontWeight="900"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        letterSpacing="1.2"
                        className="pointer-events-none drop-shadow-xs select-none"
                      >
                        {step.number}
                      </text>
                    </g>
                  );
                })}

                {/* Animated Connection Lines to Information Cards */}
                {slices.map((slice, idx) => {
                  const nodePos = polarToCartesian(cx, cy, outerR, slice.midAngle);
                  const step = stepsData[idx];
                  const isHovered = activeStep === idx;
                  const linePath = `M ${nodePos.x + 34} ${nodePos.y} L ${viewBoxWidth - 6} ${nodePos.y}`;

                  return (
                    <g key={`conn-${idx}`} className="transition-all duration-300 pointer-events-none">
                      {/* Guide line */}
                      <path
                        d={linePath}
                        stroke={step.color}
                        strokeWidth={isHovered ? 2.5 : 1.2}
                        strokeDasharray={isHovered ? '6 4' : '3 3'}
                        opacity={isHovered ? 0.95 : 0.25}
                        className="transition-all duration-300"
                      />

                      {/* Animated traveling light particle flowing from Node into Information Card */}
                      {isHovered && (
                        <circle r="4.5" fill={step.color} className="animate-pulse">
                          <animateMotion
                            path={linePath}
                            dur="1.2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Center Hub Outer Rim */}
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={innerR + 8}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="rgba(255, 255, 255, 0.98)"
                    strokeWidth="4"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={innerR - 2}
                    fill="#FFFFFF"
                    stroke="#F1F5F9"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Center Globe Image (Clean & Static) */}
                <g className="pointer-events-none select-none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={innerR - 6}
                    fill="#F8FAFC"
                  />

                  <image
                    href={processGlobeImg}
                    x={cx - (innerR - 6)}
                    y={cy - (innerR - 6)}
                    width={(innerR - 6) * 2}
                    height={(innerR - 6) * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#hub-image-clip-lg)"
                  />

                  <circle
                    cx={cx}
                    cy={cy}
                    r={innerR - 6}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                  />
                </g>

                {/* 4 Elevated Circular 3D Icon Nodes */}
                {slices.map((slice, idx) => {
                  const nodePos = polarToCartesian(cx, cy, outerR, slice.midAngle);
                  const step = stepsData[idx];
                  const isHovered = activeStep === idx;

                  return (
                    <g
                      key={`node-${step.id}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveStep(idx)}
                      onMouseLeave={() => setActiveStep(null)}
                      transform={`translate(${nodePos.x}, ${nodePos.y})`}
                    >
                      {/* Soft Light Color Glow (No black tone) */}
                      {isHovered && (
                        <circle
                          cx="0"
                          cy="0"
                          r="42"
                          fill={step.color}
                          opacity="0.22"
                          className="animate-pulse"
                        />
                      )}

                      {/* Disc */}
                      <circle
                        cx="0"
                        cy="0"
                        r="34"
                        fill="#FFFFFF"
                        stroke={isHovered ? step.color : '#E2E8F0'}
                        strokeWidth={isHovered ? '2.5' : '1.5'}
                        className="transition-colors duration-300"
                      />

                      {/* Inner Circle with light color tint on hover */}
                      <circle
                        cx="0"
                        cy="0"
                        r="28"
                        fill={isHovered ? step.color : '#F8FAFC'}
                        fillOpacity={isHovered ? 0.12 : 1}
                        stroke={isHovered ? step.color : '#FFFFFF'}
                        strokeWidth={isHovered ? '1.5' : '1.5'}
                        className="transition-colors duration-300"
                      />

                      {/* Vector Icon */}
                      <foreignObject
                        x="-20"
                        y="-20"
                        width="40"
                        height="40"
                        className="pointer-events-none"
                      >
                        <div className="w-full h-full flex items-center justify-center transform scale-90">
                          {step.illustration}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right Column: 4 Information Cards (7 Cols in wide grid) */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between space-y-4">
              {stepsData.map((step, idx) => {
                const isHovered = activeStep === idx;

                return (
                  <div
                    key={step.id}
                    onMouseEnter={() => setActiveStep(idx)}
                    onMouseLeave={() => setActiveStep(null)}
                    className="w-full relative px-6 py-4.5 rounded-2xl border transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: isHovered ? '#FFFFFF' : '#FFFFFF',
                      borderColor: isHovered ? step.color : '#E2E8F0',
                      boxShadow: isHovered ? `0 6px 20px -4px ${step.shadowColor}` : '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Left Accent Bar: Light / Solid matching color */}
                    <div
                      className="absolute left-0 top-3.5 bottom-3.5 rounded-r-full transition-all duration-300"
                      style={{
                        backgroundColor: step.color,
                        width: isHovered ? '5px' : '3.5px',
                        opacity: isHovered ? 1 : 0.6
                      }}
                    />

                    <div className="pl-3 space-y-1.5">
                      {/* Step Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wide ${step.bgLight} ${step.textColor} border ${step.borderLight}`}
                          >
                            {step.tag}
                          </span>
                          <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                            {step.title}
                          </h3>
                        </div>

                        {/* Soft Color Dot Indicator */}
                        <div
                          className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: step.color,
                            boxShadow: isHovered ? `0 0 8px ${step.color}` : 'none'
                          }}
                        />
                      </div>

                      {/* Step Description */}
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* MOBILE / TABLET VIEW: Clean Full-Width Cards with Globe Hub Badge */}
          <div className="lg:hidden space-y-4">
            
            {/* Top Summary Badge with Globe Image */}
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-primary shadow-sm shrink-0 bg-white">
                  <img
                    src={processGlobeImg}
                    alt="Process Globe"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    The 4-Step Process
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Share · Verify · Organize · Connect
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 pt-2">
              {stepsData.map((step, idx) => {
                const isHovered = activeStep === idx;
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                    className="w-full bg-white p-4 rounded-2xl border transition-all space-y-1.5 relative overflow-hidden"
                    style={{
                      borderColor: isHovered ? step.color : '#E2E8F0',
                      boxShadow: isHovered ? `0 4px 16px -2px ${step.shadowColor}` : undefined
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: step.color }}
                    />

                    <div className="flex items-center justify-between pl-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${step.bgLight} ${step.textColor}`}
                        >
                          {step.tag}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {step.title}
                        </h3>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: step.color }}
                      />
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed pl-1">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
