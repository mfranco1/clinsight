import { expect, test as base } from "@playwright/test";

export { expect };

export const test = base.extend<{ offlineNetwork: void }>({
  offlineNetwork: [
    async ({ context, baseURL }, use) => {
      if (!baseURL) throw new Error("Playwright baseURL must be configured.");

      const appOrigin = new URL(baseURL).origin;
      const unexpectedRequests: string[] = [];
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === appOrigin) {
          await route.continue();
          return;
        }

        if (
          url.hostname === "fonts.googleapis.com" &&
          url.pathname === "/css2"
        ) {
          await route.fulfill({
            contentType: "text/css",
            body: "@font-face { font-family: Inter; src: local(Arial); }",
          });
          return;
        }

        unexpectedRequests.push(`${url.origin}${url.pathname}`);
        await route.abort();
      });

      await context.routeWebSocket("**/*", (webSocket) => {
        unexpectedRequests.push("WebSocket");
        webSocket.close();
      });

      try {
        await use();
      } finally {
        expect(
          unexpectedRequests,
          "Browser tests must not attempt external network requests",
        ).toEqual([]);
      }
    },
    { auto: true },
  ],
});
