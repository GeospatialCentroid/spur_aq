// src/App/Stack/Graph/Components/Chart/D3Chart.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './D3Chart.css';

interface D3ChartProps {
    id: number;
}

const D3Chart: React.FC<D3ChartProps> = ({ id }) => {
    const ref = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove(); // Clear on rerender

        svg
            .append("circle")
            .attr("cx", 75)
            .attr("cy", 40)
            .attr("r", 30)
            .attr("fill", "steelblue");

        svg
            .append("text")
            .attr("x", 75)
            .attr("y", 95)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(`Chart #${id}`);
    }, [id]);

    return <svg ref={ref} width={150} height={100} className="d3-chart" />;
};

export default D3Chart;
