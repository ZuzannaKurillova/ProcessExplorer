import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiTimelineComponent } from './kpi-timeline.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('KpiTimelineComponent', () => {
    let component: KpiTimelineComponent;
    let fixture: ComponentFixture<KpiTimelineComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiTimelineComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(KpiTimelineComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('kpis', []);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have chart container', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.chart-container')).toBeTruthy();
    });

    it('should have svg element', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('svg')).toBeTruthy();
    });
});
