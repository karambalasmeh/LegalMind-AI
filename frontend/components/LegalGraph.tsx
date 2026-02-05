"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { useWindowSize } from "@/hooks/use-window-size"
import { Card } from "@/components/ui/card"


const ForceGraph = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-400">Loading Graph Engine...</div>
})

type Source = {
    id: string
    title: string
    text: string
    score: number
}

type GraphProps = {
    query: string
    sources: Source[]
}

export default function LegalGraph({ query, sources }: GraphProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [graphData, setGraphData] = useState({ nodes: [], links: [] })
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.clientWidth)
            setHeight(containerRef.current.clientHeight)
        }
    }, [containerRef.current])

    useEffect(() => {
        if (!query && sources.length === 0) return

        const nodes: any[] = [{
            id: "QUERY",
            name: "Current Query",
            val: 20,
            color: "#2563eb",
            type: "query"
        }]

        const links: any[] = []

        sources.forEach((src) => {
            nodes.push({
                id: src.id,
                name: `Section ${src.id.split('_')[0].substring(0, 6)}...`,
                val: 10,
                color: src.score > 0.7 ? "#16a34a" : "#64748b",
                type: "law",
                fullText: src.text
            })

            links.push({
                source: "QUERY",
                target: src.id,
                width: src.score * 5
            })
        })

        setGraphData({ nodes, links } as any)
    }, [query, sources])

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-inner relative">
            {sources.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No data to visualize
                </div>
            ) : (
                <ForceGraph
                    width={width}
                    height={height}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeRelSize={6}
                    linkColor={() => "#cbd5e1"}
                    backgroundColor="#f8fafc"

                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.color;
                        ctx.fill();

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#1e293b';
                        ctx.fillText(label, node.x, node.y + 8);
                    }}
                />
            )}

            <div className="absolute bottom-2 right-2 bg-white/80 p-2 rounded text-[10px] text-slate-500 border shadow-sm">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> User Query</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600"></span> High Match</div>
            </div>
        </div>
    )
}