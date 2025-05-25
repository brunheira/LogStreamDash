import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionCard } from "@/components/connections/connection-card";
import { NewConnectionForm } from "@/components/connections/new-connection-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RedisConnection } from "@shared/schema";

export default function Connections() {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editConnection, setEditConnection] = useState<RedisConnection | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch connections
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["/api/connections"],
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await apiRequest("POST", `/api/connections/${connectionId}/test`);
      return response.json();
    },
    onSuccess: (data, connectionId) => {
      toast({
        title: "Teste de conexão",
        description: data.success
          ? "Conexão estabelecida com sucesso!"
          : "Falha ao conectar com o Redis.",
        variant: data.success ? "default" : "destructive",
      });
      // Refresh connections to update status
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no teste",
        description: error.message || "Falha ao testar a conexão.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTestingConnection(null);
    },
  });

  // Delete connection mutation
  const deleteMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("DELETE", `/api/connections/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Conexão removida",
        description: "A conexão foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover a conexão.",
        variant: "destructive",
      });
    },
  });

  const handleTest = (connectionId: number) => {
    setTestingConnection(connectionId);
    testMutation.mutate(connectionId);
  };

  const handleEdit = (connection: RedisConnection) => {
    setEditConnection(connection);
    setShowNewForm(true);
  };

  const handleDelete = (connectionId: number) => {
    if (window.confirm("Tem certeza que deseja remover esta conexão?")) {
      deleteMutation.mutate(connectionId);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    setEditConnection(null);
  };

  const handleFormClose = (open: boolean) => {
    setShowNewForm(open);
    if (!open) {
      setEditConnection(null);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Conexões Redis
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie suas conexões com instâncias Redis
          </p>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Conexões Redis
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gerencie suas conexões com instâncias Redis
            </p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conexão
          </Button>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Nenhuma conexão Redis configurada ainda.
          </p>
          <Button onClick={() => setShowNewForm(true)} className="bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira conexão
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection: RedisConnection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onTest={handleTest}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isTestLoading={testingConnection === connection.id}
            />
          ))}
        </div>
      )}

      <NewConnectionForm
        open={showNewForm}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
        editConnection={editConnection}
      />
    </main>
  );
}
