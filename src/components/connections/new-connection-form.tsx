import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Activity, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { insertRedisConnectionSchema, type InsertRedisConnection } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editConnection?: any;
}

export function NewConnectionForm({
  open,
  onOpenChange,
  onSuccess,
  editConnection,
}: NewConnectionFormProps) {
  const [isTestLoading, setIsTestLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertRedisConnection>({
    resolver: zodResolver(insertRedisConnectionSchema),
    defaultValues: {
      name: editConnection?.name || "",
      host: editConnection?.host || "",
      port: editConnection?.port || "6379",
      password: editConnection?.password || "",
      database: editConnection?.database || "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRedisConnection) => {
      if (editConnection) {
        const response = await apiRequest("PUT", `/api/connections/${editConnection.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/connections", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: editConnection ? "Conexão atualizada" : "Conexão criada",
        description: editConnection
          ? "A conexão foi atualizada com sucesso."
          : "Nova conexão Redis foi criada com sucesso.",
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar a conexão.",
        variant: "destructive",
      });
    },
  });

  const testConnection = async () => {
    const formData = form.getValues();
    setIsTestLoading(true);
    
    try {
      // Create a temporary connection for testing if editing
      let connectionId = editConnection?.id;
      
      if (!editConnection) {
        // For new connections, we need to create it first to test
        const tempConnection = await apiRequest("POST", "/api/connections", formData);
        const result = await tempConnection.json();
        connectionId = result.id;
      }
      
      const response = await apiRequest("POST", `/api/connections/${connectionId}/test`);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Teste de conexão",
          description: "Conexão estabelecida com sucesso!",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Teste de conexão",
        description: error.message || "Falha ao conectar com o Redis.",
        variant: "destructive",
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const onSubmit = (data: InsertRedisConnection) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editConnection ? "Editar Conexão Redis" : "Nova Conexão Redis"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conexão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Redis-Prod-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="localhost ou redis.company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porta</FormLabel>
                  <FormControl>
                    <Input placeholder="6379" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha (opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={testConnection}
                disabled={isTestLoading}
                className="text-sm"
              >
                <Activity className={`w-4 h-4 mr-2 ${isTestLoading ? "animate-spin" : ""}`} />
                Testar Conexão
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary hover:bg-blue-700"
                >
                  {createMutation.isPending
                    ? "Salvando..."
                    : editConnection
                    ? "Atualizar"
                    : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
