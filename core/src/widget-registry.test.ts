import { describe, it, expect } from 'vitest';
import { WIDGET_DEFINITIONS } from './widget-registry';

describe('WIDGET_DEFINITIONS', () => {
  const expectedWidgetTypes = [
    'text',
    'line_chart', 
    'bar_chart',
    'table',
    'progress_bar',
    'sparkline',
    'gauge',
    'log_viewer',
    'metric_card'
  ];

  it('should contain all expected widget types', () => {
    const actualTypes = Object.keys(WIDGET_DEFINITIONS);
    expect(actualTypes).toEqual(expect.arrayContaining(expectedWidgetTypes));
    expect(actualTypes.length).toBe(expectedWidgetTypes.length);
  });

  expectedWidgetTypes.forEach(widgetType => {
    describe(`${widgetType} widget`, () => {
      const definition = WIDGET_DEFINITIONS[widgetType as keyof typeof WIDGET_DEFINITIONS];

      it('should have required fields', () => {
        expect(definition).toHaveProperty('name');
        expect(definition).toHaveProperty('icon');
        expect(definition).toHaveProperty('defaultSize');
        expect(definition).toHaveProperty('minSize');
        expect(definition).toHaveProperty('properties');
      });

      it('should have valid default size', () => {
        expect(definition.defaultSize.width).toBeGreaterThan(0);
        expect(definition.defaultSize.height).toBeGreaterThan(0);
        expect(Number.isInteger(definition.defaultSize.width)).toBe(true);
        expect(Number.isInteger(definition.defaultSize.height)).toBe(true);
      });

      it('should have valid minimum size', () => {
        expect(definition.minSize.width).toBeGreaterThan(0);
        expect(definition.minSize.height).toBeGreaterThan(0);
        expect(Number.isInteger(definition.minSize.width)).toBe(true);
        expect(Number.isInteger(definition.minSize.height)).toBe(true);
      });

      it('should have minimum size smaller than or equal to default size', () => {
        expect(definition.minSize.width).toBeLessThanOrEqual(definition.defaultSize.width);
        expect(definition.minSize.height).toBeLessThanOrEqual(definition.defaultSize.height);
      });

      it('should have non-empty name and icon', () => {
        expect(definition.name).toBeTruthy();
        expect(definition.icon).toBeTruthy();
        expect(typeof definition.name).toBe('string');
        expect(typeof definition.icon).toBe('string');
      });

      it('should have properties object', () => {
        expect(typeof definition.properties).toBe('object');
        expect(definition.properties).not.toBeNull();
      });
    });
  });

  describe('Widget property definitions', () => {
    it('text widget should have appropriate properties', () => {
      const textWidget = WIDGET_DEFINITIONS.text;
      expect(textWidget.properties).toHaveProperty('content');
      expect(textWidget.properties.content?.type).toBe('string');
    });

    it('bar_chart widget should have orientation property', () => {
      const barChartWidget = WIDGET_DEFINITIONS.bar_chart;
      expect(barChartWidget.properties).toHaveProperty('orientation');
      expect(barChartWidget.properties.orientation?.type).toBe('select');
      expect(barChartWidget.properties.orientation?.options).toContain('horizontal');
      expect(barChartWidget.properties.orientation?.options).toContain('vertical');
    });

    it('progress_bar widget should have color and animated properties', () => {
      const progressBarWidget = WIDGET_DEFINITIONS.progress_bar;
      expect(progressBarWidget.properties).toHaveProperty('color');
      expect(progressBarWidget.properties).toHaveProperty('animated');
      expect(progressBarWidget.properties.animated?.type).toBe('boolean');
    });

    it('table widget should have showHeaders and sortable properties', () => {
      const tableWidget = WIDGET_DEFINITIONS.table;
      expect(tableWidget.properties).toHaveProperty('showHeaders');
      expect(tableWidget.properties).toHaveProperty('sortable');
      expect(tableWidget.properties.showHeaders?.type).toBe('boolean');
      expect(tableWidget.properties.sortable?.type).toBe('boolean');
    });

    it('gauge widget should have min, max, and units properties', () => {
      const gaugeWidget = WIDGET_DEFINITIONS.gauge;
      expect(gaugeWidget.properties).toHaveProperty('min');
      expect(gaugeWidget.properties).toHaveProperty('max');
      expect(gaugeWidget.properties).toHaveProperty('units');
      expect(gaugeWidget.properties.min?.type).toBe('number');
      expect(gaugeWidget.properties.max?.type).toBe('number');
      expect(gaugeWidget.properties.units?.type).toBe('string');
    });
  });
});