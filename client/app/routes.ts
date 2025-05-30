import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("features/home.tsx"),
  route('/trpc/*', 'features/trpc/trpcServer.ts'),
] satisfies RouteConfig;
