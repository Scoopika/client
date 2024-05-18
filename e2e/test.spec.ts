import { test, expect } from "@playwright/test";

test("Main test if streaming working", async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/tests/web/test.html");

  await page.waitForTimeout(10000);

  const getInnerText = async (id: string) => {
    const text = await page.$eval(
      `#${id}`,
      (elm) => (elm as HTMLElement).innerText,
    );

    return text;
  };

  const getResults = async (ids: string[]) => {
    const res: string[] = [];

    for await (const id of ids) {
      const text = await getInnerText(id);
      res.push(text || "false");
    }

    return res;
  };

  const ids = [
    "new_session",
    "started",
    "got_token",
    "agent_loaded",
    "list_runs",
    "box_loaded",
  ];

  const results = await getResults(ids);

  await page.close();

  for (const res of results) {
    expect(res).toBe("true");
  }
});
