export interface MetricSummary {
  startYear: number;
  startValue: number;
  endYear: number;
  endValue: number;
  absoluteChange: number;
  percentageChange: number;
  cagr: number;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
}

export class StatsEngine {
  public static calculateAbsoluteChange(start: number, end: number): number {
    return Number((end - start).toFixed(2));
  }

  public static calculatePercentageChange(start: number, end: number): number {
    if (start === 0) return 0;
    return Number((((end - start) / start) * 100).toFixed(2));
  }

  public static calculateCAGR(startVal: number, endVal: number, years: number): number {
    if (startVal <= 0 || endVal <= 0 || years <= 0) return 0;
    const cagr = (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
    return Number(cagr.toFixed(2));
  }

  public static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  }

  public static calculateStdDev(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = this.calculateMean(values);
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  public static calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return Number(((value - mean) / stdDev).toFixed(2));
  }

  public static analyzeTrend(series: Array<{ year: number; value: number }>): MetricSummary {
    if (series.length < 2) {
      const val = series[0]?.value || 0;
      return {
        startYear: series[0]?.year || 2025,
        startValue: val,
        endYear: series[0]?.year || 2025,
        endValue: val,
        absoluteChange: 0,
        percentageChange: 0,
        cagr: 0,
        direction: 'stable'
      };
    }

    const sorted = [...series].sort((a, b) => a.year - b.year);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    const absChange = this.calculateAbsoluteChange(start.value, end.value);
    const pctChange = this.calculatePercentageChange(start.value, end.value);
    const years = end.year - start.year;
    const cagr = this.calculateCAGR(start.value, end.value, years);

    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
    if (pctChange > 2.0) direction = 'increasing';
    else if (pctChange < -2.0) direction = 'decreasing';
    else direction = 'stable';

    return {
      startYear: start.year,
      startValue: start.value,
      endYear: end.year,
      endValue: end.value,
      absoluteChange: absChange,
      percentageChange: pctChange,
      cagr,
      direction
    };
  }

  public static compareBeforeAfter(
    preValues: number[],
    postValues: number[]
  ): {
    preMean: number;
    postMean: number;
    delta: number;
    pctChange: number;
    statisticalDirection: 'significant increase' | 'significant decrease' | 'mild change' | 'no observable change';
  } {
    const preMean = Number(this.calculateMean(preValues).toFixed(2));
    const postMean = Number(this.calculateMean(postValues).toFixed(2));
    const delta = Number((postMean - preMean).toFixed(2));
    const pctChange = this.calculatePercentageChange(preMean, postMean);

    let direction: 'significant increase' | 'significant decrease' | 'mild change' | 'no observable change' = 'no observable change';
    if (pctChange > 5) direction = 'significant increase';
    else if (pctChange < -5) direction = 'significant decrease';
    else if (Math.abs(pctChange) >= 1) direction = 'mild change';

    return { preMean, postMean, delta, pctChange, statisticalDirection: direction };
  }
}
