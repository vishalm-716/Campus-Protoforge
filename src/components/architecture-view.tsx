"use client";

import { useMemo } from "react";
import { Card, Badge, EmptyState } from "./ui";
import { parseJson } from "@/lib/utils";

interface ApiLite {
  id: string;
  name: string;
  baseUrl: string;
  authType: string;
  category: string;
  exampleEndpoints: string;
}

export function ArchitectureView({ apis, teamName }: { apis: ApiLite[]; teamName: string }) {
  const services = useMemo(
    () =>
      apis.map((api) => ({
        id: api.id,
        name: api.name,
        baseUrl: api.baseUrl,
        authType: api.authType,
        endpoints: parseJson<{ method: string; path: string }[]>(api.exampleEndpoints, []),
      })),
    [apis],
  );

  if (services.length === 0) {
    return (
      <EmptyState
        title="No services to diagram yet"
        sub="Register two or more APIs in the API Lab and this view renders your integration architecture — your prototype on the left, every service it talks to on the right."
      />
    );
  }

  const width = Math.max(720, 240 + services.length * 200);
  const rowH = 92;
  const height = 120 + services.length * rowH;
  const protoY = height / 2 - 40;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-ink-900">🏗️ Architecture View</h3>
        <Badge tone="gray">{services.length} service{services.length === 1 ? "" : "s"}</Badge>
      </div>
      <div className="scroll-thin overflow-x-auto">
        <svg width={width} height={height} role="img" aria-label={`Architecture diagram for ${teamName}: one prototype consuming ${services.length} registered services`} className="min-w-full">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <path d="M0,0 L10,4 L0,8 z" fill="#8f99c0" />
            </marker>
          </defs>

          {/* Prototype box */}
          <rect x={30} y={protoY} width={210} height={80} rx={14} fill="#eef4ff" stroke="#5f6ff5" strokeWidth={1.6} />
          <text x={135} y={protoY + 32} textAnchor="middle" fontSize={14} fontWeight={700} fill="#32369c">{teamName}</text>
          <text x={135} y={protoY + 52} textAnchor="middle" fontSize={11} fill="#525d8a">prototype (client)</text>

          {/* Service boxes */}
          {services.map((s, i) => {
            const y = 40 + i * rowH;
            const midY = protoY + 40;
            const boxMidY = y + 36;
            return (
              <g key={s.id}>
                <path
                  d={`M 240 ${midY} C 300 ${midY}, 320 ${boxMidY}, 360 ${boxMidY}`}
                  stroke="#b9c0da"
                  strokeWidth={1.4}
                  fill="none"
                  markerEnd="url(#arrow)"
                />
                <rect x={360} y={y} width={230} height={72} rx={12} fill="#ffffff" stroke="#d9dded" strokeWidth={1.2} />
                <text x={380} y={y + 26} fontSize={12.5} fontWeight={700} fill="#1d2340">{s.name}</text>
                <text x={380} y={y + 44} fontSize={10.5} fill="#6b76a3">{s.baseUrl.replace(/^https?:\/\//, "").slice(0, 32)}</text>
                <text x={380} y={y + 60} fontSize={10} fill="#8f99c0">
                  {s.endpoints.length ? `${s.endpoints.length} endpoint${s.endpoints.length === 1 ? "" : "s"}` : "no endpoints listed"} · {s.authType === "none" ? "no auth" : s.authType}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 text-xs text-ink-400">
        Generated from your team's registered APIs. Add more services in the API Lab to grow the diagram — future MCP-style agent tools will plug into the same registry.
      </p>
    </Card>
  );
}
