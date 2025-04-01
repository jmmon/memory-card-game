// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/build/*",
    "/assets/*"
  ]
};

// node_modules/.pnpm/wrangler@4.6.0_@cloudflare+workers-types@4.20250327.0/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/joepx/code/projects/memory-card-game/memory-card-game/.wrangler/tmp/pages-snpkpk/bundledWorker-0.8245324524958224.mjs";
import { isRoutingRuleMatch } from "/home/joepx/code/projects/memory-card-game/memory-card-game/node_modules/.pnpm/wrangler@4.6.0_@cloudflare+workers-types@4.20250327.0/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/joepx/code/projects/memory-card-game/memory-card-game/.wrangler/tmp/pages-snpkpk/bundledWorker-0.8245324524958224.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=o6s6rz2fau.js.map
