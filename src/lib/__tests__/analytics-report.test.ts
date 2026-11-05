import { describe, it, expect } from "vitest";
import {
  reportPeriods,
  eachDay,
  formatDuration,
  shapeGaTotals,
  shapeGaChannels,
  shapeGaDevices,
  mobileShare,
  shapeGaTopPages,
  shapeGaDaily,
  sumMetaValues,
  lastMetaValue,
  metaDaily,
} from "../analytics-report";

const rows = (...r: [string[], string[]][]) => ({ rows: r.map(([d, m]) => ({ dimensionValues: d.map((value) => ({ value })), metricValues: m.map((value) => ({ value })) })) });

describe("reportPeriods", () => {
  it("uses 28 days and 7 days, both ending yesterday (Sydney)", () => {
    const { report, chart } = reportPeriods(new Date("2026-11-05T02:00:00Z")); // 13:00 on 5 Nov in Sydney
    expect(report.end).toBe("2026-11-04");
    expect(chart.end).toBe("2026-11-04");
    expect(eachDay(report.start, report.end)).toHaveLength(28);
    expect(eachDay(chart.start, chart.end)).toHaveLength(7);
    expect(report.start).toBe("2026-10-08");
    expect(chart.start).toBe("2026-10-29");
  });
  it("uses the Sydney date, not UTC, near midnight", () => {
    // 20:00 UTC on 4 Nov is already 7am on 5 Nov in Sydney, so "yesterday" is 4 Nov.
    expect(reportPeriods(new Date("2026-11-04T20:00:00Z")).report.end).toBe("2026-11-04");
  });
});

describe("formatDuration", () => {
  it("formats and never shows 60s", () => {
    expect(formatDuration(41)).toBe("0m 41s");
    expect(formatDuration(119.6)).toBe("2m 00s");
    expect(formatDuration(-5)).toBe("0m 00s");
  });
});

describe("GA4 shaping", () => {
  it("returns null for empty/missing reports instead of placeholder numbers", () => {
    expect(shapeGaTotals(null)).toBeNull();
    expect(shapeGaTotals({ rows: [] })).toBeNull();
    expect(shapeGaChannels({ rows: [] })).toBeNull();
    expect(shapeGaDevices(undefined)).toBeNull();
    expect(shapeGaTopPages({})).toBeNull();
    expect(shapeGaDaily({ rows: [] }, reportPeriods().chart)).toBeNull();
  });

  it("builds totals", () => {
    expect(shapeGaTotals(rows([[], ["926", "1100", "1248", "41"]]))).toEqual({ users: 926, sessions: 1100, pageViews: 1248, avgSessionDuration: "0m 41s" });
  });

  it("channel percentages are share of sessions and add up to ~100", () => {
    const ch = shapeGaChannels(rows([["Organic Search"], ["500", "400"]], [["Direct"], ["300", "250"]], [["Referral"], ["200", "150"]], [["Email"], ["0", "0"]]))!;
    expect(ch.map((c) => c.name)).toEqual(["Organic Search", "Direct", "Referral"]); // zero-session rows dropped
    expect(ch.reduce((s, c) => s + c.percentage, 0)).toBeCloseTo(100, 0);
    expect(ch[0].percentage).toBe(50);
  });

  it("mobile share comes from deviceCategory and is 0 (not undefined) if there is no mobile traffic", () => {
    const d = shapeGaDevices(rows([["mobile"], ["650"]], [["desktop"], ["300"]], [["tablet"], ["50"]]));
    expect(mobileShare(d)).toBe(65);
    expect(mobileShare(shapeGaDevices(rows([["desktop"], ["10"]])))).toBe(0);
    expect(mobileShare(null)).toBeNull();
  });

  it("top pages are sorted, limited to 5, drop (not set) titles and total no more than site views", () => {
    const report = rows(
      [["/a", "A"], ["50", "500"]], [["/b", "(not set)"], ["300", "30"]], [["/c", "C"], ["20", "0"]],
      [["/d", "D"], ["10", "10"]], [["/e", "E"], ["5", "5"]], [["/f", "F"], ["4", "4"]],
    );
    const pages = shapeGaTopPages(report)!;
    expect(pages).toHaveLength(5);
    expect(pages[0].path).toBe("/b");
    expect(pages[0].title).toBe("/b"); // falls back to the path
    expect(pages[1].avgEngagement).toBe("0m 10s"); // 500s / 50 views
    const siteViews = 1248;
    expect(pages.reduce((s, p) => s + p.views, 0)).toBeLessThanOrEqual(siteViews);
  });

  it("daily series covers every day of the window, with real zeros for days GA omitted", () => {
    const period = { days: 7, start: "2026-10-29", end: "2026-11-04" };
    const daily = shapeGaDaily(rows([["20261030"], ["5", "9"]], [["20261101"], ["7", "12"]], [["bogus"], ["1", "1"]]), period)!;
    expect(daily).toHaveLength(7);
    expect(daily.find((d) => d.date === "2026-10-30")).toMatchObject({ users: 5, pageViews: 9 });
    expect(daily.find((d) => d.date === "2026-10-31")).toMatchObject({ users: 0, pageViews: 0 });
  });
});

describe("Meta shaping", () => {
  it("sums only numeric values and returns null when there is nothing", () => {
    expect(sumMetaValues([{ value: 3 }, { value: 4 }, { value: { x: 1 } as any }])).toBe(7);
    expect(sumMetaValues([])).toBeNull();
    expect(sumMetaValues(null)).toBeNull();
    expect(sumMetaValues([{ value: { x: 1 } as any }])).toBeNull();
  });
  it("takes the latest value for rolling metrics", () => {
    expect(lastMetaValue([{ value: 10 }, { value: 12 }])).toBe(12);
    expect(lastMetaValue(undefined)).toBeNull();
  });
  it("labels each day by the day it measured", () => {
    const d = metaDaily([{ value: 5, end_time: "2026-11-04T08:00:00+0000" }])!;
    expect(d[0].date).toBe("2026-11-03");
  });
});
