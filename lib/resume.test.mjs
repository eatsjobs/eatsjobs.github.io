import assert from "node:assert/strict";
import { test } from "node:test";
import { groupWork, inlineLinks, monthYear, printableUrl, publishedResume } from "./resume.js";

test("monthYear formats a JSON Resume date as it reads on the timeline", () => {
  assert.equal(monthYear("2022-09"), "Sep 2022");
  assert.equal(monthYear("2015-02"), "Feb 2015");
});

test("monthYear reads a missing end date as Present", () => {
  assert.equal(monthYear(undefined), "Present");
});

test("groupWork nests consecutive roles at one company under it", () => {
  const work = [
    { name: "Scandit", location: "Remote", position: "Senior", startDate: "2024-07" },
    {
      name: "Scandit",
      location: "Remote",
      position: "Mid",
      startDate: "2022-09",
      endDate: "2024-07",
    },
    {
      name: "eDreamsOdigeo",
      location: "Barcelona",
      position: "Mid",
      startDate: "2019-07",
      endDate: "2022-09",
    },
  ];
  const companies = groupWork(work);
  assert.deepEqual(
    companies.map(({ name, location, startDate, endDate, isCurrent, positions }) => ({
      name,
      location,
      startDate,
      endDate,
      isCurrent,
      roles: positions.map((role) => role.position),
    })),
    [
      {
        name: "Scandit",
        location: "Remote",
        startDate: "2022-09",
        endDate: undefined,
        isCurrent: true,
        roles: ["Senior", "Mid"],
      },
      {
        name: "eDreamsOdigeo",
        location: "Barcelona",
        startDate: "2019-07",
        endDate: "2022-09",
        isCurrent: false,
        roles: ["Mid"],
      },
    ],
  );
});

test("groupWork keeps a return to an earlier company as its own entry", () => {
  const work = [
    { name: "A", startDate: "2020-01" },
    { name: "B", startDate: "2018-01", endDate: "2020-01" },
    { name: "A", startDate: "2016-01", endDate: "2018-01" },
  ];
  assert.deepEqual(
    groupWork(work).map((company) => company.name),
    ["A", "B", "A"],
  );
});

test("printableUrl drops the scheme, www and trailing slash", () => {
  assert.equal(
    printableUrl("https://www.linkedin.com/in/pasquale-mangialavori"),
    "linkedin.com/in/pasquale-mangialavori",
  );
  assert.equal(
    printableUrl("https://eatsjobs.github.io/pizza-birra/"),
    "eatsjobs.github.io/pizza-birra",
  );
});

test("inlineLinks turns [text](url) into a link that also prints its address", () => {
  assert.equal(
    inlineLinks("Developed [PizzaBirra](https://eatsjobs.github.io/pizza-birra/), a game."),
    'Developed <a href="https://eatsjobs.github.io/pizza-birra/" data-print-url="eatsjobs.github.io/pizza-birra" target="_blank" rel="noreferrer">PizzaBirra</a>, a game.',
  );
});

test("inlineLinks escapes everything else as text", () => {
  assert.equal(inlineLinks("Tom & <Jerry>"), "Tom &amp; &lt;Jerry&gt;");
});

test("publishedResume spells inline links out as plain text", () => {
  const resume = {
    work: [
      {
        name: "Balzo",
        summary: "Developed [PizzaBirra](https://eatsjobs.github.io/pizza-birra/).",
      },
    ],
  };
  assert.equal(
    publishedResume(resume).work[0].summary,
    "Developed PizzaBirra (https://eatsjobs.github.io/pizza-birra/).",
  );
});

test("publishedResume leaves the site's own data untouched", () => {
  const resume = { work: [{ name: "Balzo", summary: "[a](https://b.c)" }] };
  publishedResume(resume);
  assert.equal(resume.work[0].summary, "[a](https://b.c)");
});
