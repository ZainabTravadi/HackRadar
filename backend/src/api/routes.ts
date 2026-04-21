// Central route registry for the HTTP API layer that will be added after Day 1.
export type ApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRouteDefinition {
  method: ApiRouteMethod;
  path: string;
  description: string;
}

export const apiRoutes: ApiRouteDefinition[] = [];