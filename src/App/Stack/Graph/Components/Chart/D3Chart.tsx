// src/App/Stack/Graph/Components/Chart/D3Chart.tsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './D3Chart.css';

interface D3ChartProps {
    id: number;
    selection: [number, number];
}

const D3Chart: React.FC<D3ChartProps> = ({ id, selection }) => {
    const ref = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        const [x0, x1] = selection;
        const width = 150;
        const height = 100;

        const svg = d3.select(ref.current);
        svg.selectAll('*').remove();

        const xScale = d3.scaleLinear().domain([x0, x1]).range([0, width]);
        const mid = (x0 + x1) / 2;
        svg
            .append('circle')
            .attr('cx', xScale(mid))
            .attr('cy', height / 2 - 10)
            .attr('r', 20)
            .attr('fill', 'steelblue');
        svg
            .append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(`Chart #${id}`);
    }, [id, selection]);

    return <svg ref={ref} width={150} height={100} className="d3-chart" />;
};

export default D3Chart;
