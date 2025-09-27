export interface Project {
    created_at: string; // timestamp with time zone
    name: string; // text
    status: "launchpad" | "trading"; // Only "launchpad" or "trading"
    price: number; // double precision
    available_shares: number; // integer
    location: string; // text
    type: string; // text
    image: string; // text (URL or base64 encoded image)
    attributes?: Record<string, undefined>; // jsonb (key-value pairs)
    value_parameters?: undefined[]; // jsonb (array of any type)
    updates?: undefined[]; // jsonb (array of any type)
    id: string; // uuid
    growth: string; // text
    description: string; // text
  }