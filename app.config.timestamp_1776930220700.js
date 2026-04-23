// app.config.ts
import { defineConfig } from "vinxi/config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
var app_config_default = defineConfig({
  server: {
    preset: "vercel"
  },
  routers: {
    public: {
      type: "static",
      dir: "./public",
      base: "/"
    },
    ssr: {
      type: "http",
      dir: "./src",
      handler: "./src/entry-server.tsx",
      // I need to make sure this exists
      target: "server",
      plugins: () => [
        tsconfigPaths(),
        tanstackStart()
      ]
    },
    client: {
      type: "client",
      dir: "./src",
      handler: "./src/entry-client.tsx",
      // I need to make sure this exists
      target: "browser",
      plugins: () => [
        tsconfigPaths(),
        tanstackStart()
      ],
      base: "/_build"
    }
  }
});
export {
  app_config_default as default
};
