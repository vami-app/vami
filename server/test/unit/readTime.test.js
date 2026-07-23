"use strict";

const { estimateReadTime } = require("../../src/utils/readTime");

describe("Read Time Estimator (estimateReadTime)", () => {
  it("returns at least 1 minute for short content", () => {
    expect(estimateReadTime("<p>Short story</p>")).toBe(1);
  });

  it("calculates accurate read time based on ~200 WPM", () => {
    const words = new Array(500).fill("word").join(" ");
    const html = `<p>${words}</p>`;
    expect(estimateReadTime(html)).toBe(3); // 500 / 200 = 2.5 -> ceil(2.5) = 3
  });
});
