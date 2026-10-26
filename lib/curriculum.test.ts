import { describe, expect, it } from "vitest";
import { centralContent, curriculumForPrompt, stagesFor, syllabusText } from "./curriculum";

describe("stagesFor", () => {
  it("maps grades to stages and defaults to 4–6 and 7–9", () => {
    expect(stagesFor([5, 7])).toEqual(["4-6", "7-9"]);
    expect(stagesFor([5, 5, null])).toEqual(["4-6"]);
    expect(stagesFor([null])).toEqual(["4-6", "7-9"]);
  });
});

describe("syllabusText", () => {
  it("turns Skolverket's HTML into headings and bullet lines", () => {
    const html =
      "<h3>I årskurs 4–6</h3><h4>Historia</h4> <ul> <li>Stormaktstiden &amp; be&shy;ty­delse.</li> <li>Karl XII.</li> </ul>";
    expect(syllabusText(html)).toBe("I årskurs 4–6\n\nHistoria\n\n- Stormaktstiden & betydelse.\n- Karl XII.");
  });
});

describe("centralContent", () => {
  it("picks the stages asked for, including entries that span several", () => {
    const subject = {
      centralContents: [
        { year: "1-3", text: "<li>Ett</li>" },
        { year: "4-6", text: "<li>Fyra</li>" },
        { year: "4-9", text: "<li>Alla</li>" },
        { year: "7-9", text: "<li>Sju</li>" },
      ],
    };
    expect(centralContent(subject, ["7-9"])).toEqual([{ stage: "7-9", text: "- Alla\n\n- Sju" }]);
    expect(centralContent(subject, ["4-6"])[0].text).toBe("- Fyra\n\n- Alla");
  });
});

describe("curriculumForPrompt", () => {
  it("labels each stage and is empty without content", () => {
    expect(curriculumForPrompt([{ stage: "4-6", text: "- X" }])).toBe('<curriculum stage="åk 4-6">\n- X\n</curriculum>');
    expect(curriculumForPrompt(null)).toBe("");
  });
});
