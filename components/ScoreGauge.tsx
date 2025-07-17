import React from 'react';

const GAUGE_RADIUS = 80;
const GAUGE_WIDTH = 30;
const TOTAL_ANGLE = 180;

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const GaugeSegment: React.FC<{ color: string; startAngle: number; endAngle: number; }> = ({ color, startAngle, endAngle }) => (
    <path
        d={describeArc(100, 100, GAUGE_RADIUS, startAngle, endAngle)}
        fill="none"
        stroke={color}
        strokeWidth={GAUGE_WIDTH}
    />
);

const getScoreLabel = (score: number) => {
    if (score < 20) return { text: "強力賣出", color: "text-red-400" };
    if (score < 40) return { text: "賣出", color: "text-rose-400" };
    if (score < 60) return { text: "中立", color: "text-gray-400" };
    if (score < 80) return { text: "買進", color: "text-lime-400" };
    return { text: "強力買進", color: "text-green-400" };
};

export const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const validScore = Math.max(0, Math.min(99, score));
    const angle = (validScore / 99) * TOTAL_ANGLE;
    const {text, color} = getScoreLabel(validScore);

    const segments = [
        { color: "#ef4444", start: 0, end: 36 }, // red-500
        { color: "#f472b6", start: 36, end: 72 }, // rose-400
        { color: "#6b7280", start: 72, end: 108 }, // gray-500
        { color: "#a3e635", start: 108, end: 144 }, // lime-400
        { color: "#4ade80", start: 144, end: 180 }, // green-400
    ];

    return (
        <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 200 110" className="w-full max-w-xs">
                <g>
                    {segments.map((seg, i) => (
                        <GaugeSegment key={i} color={seg.color} startAngle={seg.start} endAngle={seg.end} />
                    ))}
                </g>
                <g className="transition-transform duration-700 ease-out" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}>
                    <path d="M 100 100 L 100 25" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="100" cy="100" r="5" fill="#ffffff" />
                </g>
                <text x="100" y="80" textAnchor="middle" className="text-4xl font-bold fill-white">
                    {validScore}
                </text>
                 <text x="100" y="98" textAnchor="middle" className={`text-sm font-semibold ${color.replace('text-','fill-')}`}>
                    {text}
                </text>
            </svg>
        </div>
    );
};
