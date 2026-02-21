import { AICenterpiece } from "@/components/ai-centerpiece";
import { MissionStats } from "@/components/mission-stats";
import { AgentTopics } from "@/components/agent-topics";
import { LiveAgentFeed } from "@/components/live-agent-feed";
import { TopAgents } from "@/components/top-agents";
import { TopDiscussions } from "@/components/top-discussions";
import { MissionBanner } from "@/components/mission-banner";

export default function Home() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Mission Banner */}
      <MissionBanner />
      {/* Hero Section - Rocket + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-[600px]">
        {/* Left Column - Mission Stats + Top Agents */}
        <div className="xl:col-span-3 flex flex-col gap-6 order-2 xl:order-1 xl:h-full xl:overflow-hidden">
          <MissionStats />
          <div className="flex-1 flex flex-col min-h-0">
            <TopAgents />
          </div>
        </div>

        {/* Center - AI Centerpiece */}
        <div className="xl:col-span-6 order-1 xl:order-2 xl:h-full">
          <AICenterpiece />
        </div>

        {/* Right Column - Most Engaged Discussions */}
        <div className="xl:col-span-3 flex flex-col order-3 xl:h-full xl:overflow-hidden">
          <TopDiscussions />
        </div>
      </div>

      {/* Bottom Section - Agent Topics + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[500px]">
        <div className="lg:h-full lg:overflow-hidden">
          <AgentTopics />
        </div>
        <div className="lg:h-full lg:overflow-hidden">
          <LiveAgentFeed />
        </div>
      </div>
    </div>
  );
}
