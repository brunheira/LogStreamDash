import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConnectionHealth } from "@/components/dashboard/connection-health";

export default function ConnectionHealthPage() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>();

  // Fetch connections
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/connections"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Status das Conexões
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Monitoramento em tempo real do status e performance das conexões Redis
            </p>
          </div>
        </div>

        <ConnectionHealth 
          connections={connections || []}
          selectedConnectionId={selectedConnectionId}
        />
      </div>
    </main>
  );
}