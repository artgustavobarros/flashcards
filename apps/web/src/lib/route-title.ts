import type { AnyRouteMatch } from "@tanstack/react-router";

// The title set in staticData by the deepest route that has one.
export function routeTitle(matches: AnyRouteMatch[]) {
  return matches.findLast((match) => match.staticData.title)?.staticData.title;
}
