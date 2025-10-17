import React from 'react';
import Link from 'next/link';
import { Table } from '../../shared/components/Table';
import { Button } from '../../shared/components/Button';
import { Eye, Edit, Trash2, Play, Pause } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  youtubeUrl: string;
  costPerView: number;
  totalViews: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
  loading?: boolean;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
  onToggleStatus?: (campaign: Campaign) => void;
}

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  loading = false,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const columns = [
    {
      key: 'title',
      header: 'Titre',
      render: (value: string, campaign: Campaign) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {campaign.youtubeUrl}
          </div>
        </div>
      )
    },
    {
      key: 'costPerView',
      header: 'Coût/vue',
      render: (value: number) => (
        <span className="font-medium text-green-600">
          ${value.toFixed(4)}
        </span>
      )
    },
    {
      key: 'totalViews',
      header: 'Vues',
      render: (value: number) => (
        <span className="font-medium">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'status',
      header: 'Statut',
      render: (value: string) => {
        const statusConfig = {
          ACTIVE: { label: 'Actif', color: 'bg-green-100 text-green-800' },
          PAUSED: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
          COMPLETED: { label: 'Terminé', color: 'bg-gray-100 text-gray-800' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: unknown, campaign: Campaign) => (
        <div className="flex items-center space-x-2">
          <Link href={`/campaigns/${campaign.id}`}>
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(campaign)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onToggleStatus && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onToggleStatus(campaign)}
            >
              {campaign.status === 'ACTIVE' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(campaign)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Table
      data={campaigns}
      columns={columns}
      loading={loading}
      emptyMessage="Aucune campagne trouvée"
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    />
  );
};