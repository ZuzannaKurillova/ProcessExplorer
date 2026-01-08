import { Component, inject } from '@angular/core';
import { ProcessDataService } from './services/process-data.service';
import { ProcessGraphComponent } from './components/process-graph/process-graph.component';
import { BottleneckChartComponent } from './components/bottleneck-chart/bottleneck-chart.component';
import { KpiTimelineComponent } from './components/kpi-timeline/kpi-timeline.component';

@Component({
  imports: [ProcessGraphComponent, BottleneckChartComponent, KpiTimelineComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly dataService = inject(ProcessDataService);

  // Expose signals to template
  readonly processNodes = this.dataService.processNodes;
  readonly processLinks = this.dataService.processLinks;
  readonly activityStats = this.dataService.activityStats;
  readonly dailyKPIs = this.dataService.dailyKPIs;
  readonly selectedActivity = this.dataService.selectedActivity;

  clearSelection(): void {
    this.dataService.selectActivity(null);
  }
}
