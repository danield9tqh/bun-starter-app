import {
  createRouter,
  createRootRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { Home } from "./routes/Home";

const rootRoute = createRootRoute({
  component: Home,
});

const routeTree = rootRoute;

const router = createRouter({ routeTree });

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
