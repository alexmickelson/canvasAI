// import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
// import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
// import { appRouter } from "./utils/main";
// import { createTRPCContext } from "@trpc/tanstack-react-query";

// export const loader = async (args: LoaderFunctionArgs) => {
//   return handleRequest(args);
// };

// export const action = async (args: ActionFunctionArgs) => {
//   return handleRequest(args);
// };

// function handleRequest(args: LoaderFunctionArgs | ActionFunctionArgs) {
//   return fetchRequestHandler({
//     endpoint: "/trpc",
//     req: args.request,
//     router: appRouter,
//     createContext: () => createTRPCContext(),
//   });
// }
