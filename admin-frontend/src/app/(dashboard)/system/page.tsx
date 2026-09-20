'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Activity, RefreshCw, Power, PowerOff, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemPage() {
  const queryClient = useQueryClient();

  const { data: discovery, isLoading: loadingDiscovery } = useQuery({
    queryKey: ['system-discovery'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/discovery');
      return res.data;
    }
  });

  const { data: containers, isLoading: loadingContainers } = useQuery({
    queryKey: ['docker-containers'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/docker/containers');
      return res.data;
    }
  });

  const actionMutation = useMutation({
    mutationFn: async ({ service, action }: { service: string, action: string }) => {
      const res = await apiClient.post(`/admin/docker/${service}/action`, { action });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully executed ${variables.action} on ${variables.service}`);
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
    },
    onError: () => {
      toast.error('Failed to execute action. Ensure Docker daemon is accessible.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System & Infrastructure</h1>
          <p className="text-muted-foreground mt-1">Real-time status of microservices and infrastructure.</p>
        </div>
        <Button variant="outline" onClick={() => {
          queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
          queryClient.invalidateQueries({ queryKey: ['system-discovery'] });
        }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-primary" />
              Service Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDiscovery ? (
              <p className="text-sm text-muted-foreground">Loading topology...</p>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Registered Microservices</p>
                  <ul className="text-sm space-y-2">
                    {discovery?.services?.map((svc: any) => (
                      <li key={svc.name} className="flex justify-between items-center">
                        <span className="font-mono text-muted-foreground">{svc.name}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{svc.port}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="w-5 h-5 text-primary" />
              Docker Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingContainers ? (
              <p className="text-sm text-muted-foreground">Fetching container states...</p>
            ) : (
              <div className="space-y-3">
                {containers?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No containers detected or Docker daemon unavailable.</p>
                )}
                {containers?.map((container: any) => (
                  <div key={container.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${container.state === 'running' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-semibold text-sm">{container.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{container.image} • {container.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {container.state === 'running' ? (
                        <>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-orange-500" title="Restart" 
                            onClick={() => actionMutation.mutate({ service: container.name, action: 'restart' })}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-red-500" title="Stop"
                            onClick={() => actionMutation.mutate({ service: container.name, action: 'stop' })}>
                            <PowerOff className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-500" title="Start"
                          onClick={() => actionMutation.mutate({ service: container.name, action: 'start' })}>
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
