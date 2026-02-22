import type { MetadataRoute } from "next";
import rocketsData from "../../public/data/rockets.json";
import crewData from "../../public/data/crew.json";
import launchesData from "../../public/data/launches.json";
import discussionsData from "../../public/data/discussions.json";
import insightsData from "../../public/data/insights.json";
import agentsData from "../../public/data/agents.json";
import reportsData from "../../public/data/news-reports.json";
import dashboardData from "../../public/data/ll2-starship-dashboard.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://elonagents.vercel.app";
  const now = new Date();

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/missions`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/live`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/discussions`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/agents`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/insights`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/articles`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/crew`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/vehicles`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/starship`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/feed`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/starlink`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/iss-reports`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/comms`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Dynamic: agents
  const agentRoutes: MetadataRoute.Sitemap = (agentsData as { id: string }[]).map((a) => ({
    url: `${baseUrl}/agents/${a.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: discussions
  const discussionRoutes: MetadataRoute.Sitemap = (discussionsData as { id: string }[]).map((d) => ({
    url: `${baseUrl}/discussions/${d.id}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Dynamic: insights
  const insightRoutes: MetadataRoute.Sitemap = (insightsData as { id: string }[]).map((i) => ({
    url: `${baseUrl}/insights/${i.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: missions (launches)
  const missionRoutes: MetadataRoute.Sitemap = (launchesData as { id: string }[]).map((l) => ({
    url: `${baseUrl}/missions/${l.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Dynamic: vehicles (rockets)
  const vehicleRoutes: MetadataRoute.Sitemap = (rocketsData as { id: string }[]).map((r) => ({
    url: `${baseUrl}/vehicles/${r.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Dynamic: crew
  const crewRoutes: MetadataRoute.Sitemap = (crewData as { id: string }[]).map((c) => ({
    url: `${baseUrl}/crew/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Dynamic: starship flights
  const dashboard = dashboardData as { previous?: { launches?: { id: string }[] }; upcoming?: { launches?: { id: string }[] } };
  const starshipFlights = [
    ...(dashboard.previous?.launches || []),
    ...(dashboard.upcoming?.launches || []),
  ];
  const starshipRoutes: MetadataRoute.Sitemap = starshipFlights.map((f) => ({
    url: `${baseUrl}/starship/${f.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Dynamic: ISS reports
  const reportRoutes: MetadataRoute.Sitemap = (reportsData as { id: number }[]).map((r) => ({
    url: `${baseUrl}/iss-reports/${r.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [
    ...staticRoutes,
    ...agentRoutes,
    ...discussionRoutes,
    ...insightRoutes,
    ...missionRoutes,
    ...vehicleRoutes,
    ...crewRoutes,
    ...starshipRoutes,
    ...reportRoutes,
  ];
}
