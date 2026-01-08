import { Component, ElementRef, input, effect, viewChild } from '@angular/core';
import * as d3 from 'd3';
import { DailyKPI } from '../../models/event-log.model';

@Component({
    selector: 'app-kpi-timeline',
    standalone: true,
    template: `
    <div class="chart-container">
      <h3>KPI Timeline</h3>
      <p class="chart-subtitle">Performance metrics over time</p>
      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot duration"></span>
          <span>Avg Case Duration (hrs)</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot count"></span>
          <span>Completed Cases</span>
        </div>
      </div>
      <svg #chart></svg>
      <div #tooltip class="tooltip"></div>
    </div>
  `,
    styles: [`
    .chart-container {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    h3 {
      margin: 0 0 4px 0;
      color: var(--text-primary);
      font-size: 1.1rem;
      font-weight: 600;
    }
    .chart-subtitle {
      margin: 0 0 8px 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .legend {
      display: flex;
      gap: 20px;
      margin-bottom: 12px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .legend-dot.duration {
      background: #2196F3;
    }
    .legend-dot.count {
      background: #4CAF50;
    }
    svg {
      flex: 1;
      min-height: 200px;
    }
    .tooltip {
      position: absolute;
      background: var(--tooltip-bg);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 100;
    }
  `]
})
export class KpiTimelineComponent {
    kpis = input.required<DailyKPI[]>();

    private readonly chartRef = viewChild.required<ElementRef<SVGSVGElement>>('chart');
    private readonly tooltipRef = viewChild.required<ElementRef<HTMLDivElement>>('tooltip');

    constructor() {
        effect(() => {
            const kpis = this.kpis();
            const svg = this.chartRef().nativeElement;
            if (kpis.length > 0 && svg) {
                this.renderChart(kpis);
            }
        });
    }

    private renderChart(kpis: DailyKPI[]): void {
        const svg = d3.select(this.chartRef().nativeElement);
        svg.selectAll('*').remove();

        const tooltip = d3.select(this.tooltipRef().nativeElement);

        const container = this.chartRef().nativeElement.parentElement;
        const width = container?.clientWidth || 400;
        const height = 220;

        const margin = { top: 20, right: 50, bottom: 30, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        svg.attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(kpis, d => d.date) as [Date, Date])
            .range([0, innerWidth]);

        const yScaleDuration = d3.scaleLinear()
            .domain([0, d3.max(kpis, d => d.avgCaseDuration) || 1])
            .range([innerHeight, 0])
            .nice();

        const yScaleCount = d3.scaleLinear()
            .domain([0, d3.max(kpis, d => d.caseCount) || 1])
            .range([innerHeight, 0])
            .nice();

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScaleDuration)
                .tickSize(-innerWidth)
                .tickFormat(() => ''))
            .call(g => g.selectAll('line').attr('stroke', 'var(--border-color)').attr('stroke-opacity', 0.3))
            .call(g => g.select('.domain').remove());

        // Line generators
        const durationLine = d3.line<DailyKPI>()
            .x(d => xScale(d.date))
            .y(d => yScaleDuration(d.avgCaseDuration))
            .curve(d3.curveMonotoneX);

        const countLine = d3.line<DailyKPI>()
            .x(d => xScale(d.date))
            .y(d => yScaleCount(d.caseCount))
            .curve(d3.curveMonotoneX);

        // Draw duration line
        g.append('path')
            .datum(kpis)
            .attr('fill', 'none')
            .attr('stroke', '#2196F3')
            .attr('stroke-width', 2.5)
            .attr('d', durationLine);

        // Draw count line
        g.append('path')
            .datum(kpis)
            .attr('fill', 'none')
            .attr('stroke', '#4CAF50')
            .attr('stroke-width', 2.5)
            .attr('d', countLine);

        // Duration dots
        g.selectAll('.dot-duration')
            .data(kpis)
            .join('circle')
            .attr('class', 'dot-duration')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScaleDuration(d.avgCaseDuration))
            .attr('r', 5)
            .attr('fill', '#2196F3')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d, tooltip))
            .on('mouseout', () => this.hideTooltip(tooltip));

        // Count dots
        g.selectAll('.dot-count')
            .data(kpis)
            .join('circle')
            .attr('class', 'dot-count')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScaleCount(d.caseCount))
            .attr('r', 5)
            .attr('fill', '#4CAF50')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d, tooltip))
            .on('mouseout', () => this.hideTooltip(tooltip));

        // X axis
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(d3.timeDay.every(1))
                .tickFormat(d => d3.timeFormat('%b %d')(d as Date)))
            .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
            .selectAll('text')
            .attr('fill', 'var(--text-secondary)')
            .attr('font-size', '10px');

        // Left Y axis (duration)
        g.append('g')
            .attr('class', 'y-axis-left')
            .call(d3.axisLeft(yScaleDuration).ticks(5).tickFormat(d => `${d}h`))
            .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
            .selectAll('text')
            .attr('fill', '#2196F3')
            .attr('font-size', '10px');

        // Right Y axis (count)
        g.append('g')
            .attr('class', 'y-axis-right')
            .attr('transform', `translate(${innerWidth},0)`)
            .call(d3.axisRight(yScaleCount).ticks(5))
            .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
            .selectAll('text')
            .attr('fill', '#4CAF50')
            .attr('font-size', '10px');
    }

    private showTooltip(event: MouseEvent, d: DailyKPI, tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>): void {
        const dateStr = d3.timeFormat('%b %d, %Y')(d.date);
        tooltip
            .style('opacity', 1)
            .style('left', `${event.offsetX + 10}px`)
            .style('top', `${event.offsetY - 10}px`)
            .html(`
        <strong>${dateStr}</strong><br/>
        Avg Duration: ${d.avgCaseDuration.toFixed(1)} hrs<br/>
        Cases: ${d.caseCount}
      `);
    }

    private hideTooltip(tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>): void {
        tooltip.style('opacity', 0);
    }
}
