import { useState } from "react";
import { mockClients } from "@/lib/mock-data";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { Button } from "@/components/ui/button";
import { Download, Filter, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const [clients] = useState(mockClients);
  const navigate = useNavigate();

  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Clients</h1>
          <p className="text-muted-foreground">
            Manage and monitor all clients across your organization
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <ClientsTable clients={clients} onViewClient={handleViewClient} />
    </div>
  );
};

export default Clients;
