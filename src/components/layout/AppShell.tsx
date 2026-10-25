import React from 'react';
import { Header } from './Header';
import { useNavigation } from '../../context/NavigationContext';
import { useUserSession } from '../../context/UserSessionContext';
import { ReportingModule } from '../../modules/reporting';
import { PrePlanningPlaceholder } from '../../modules/pre-planning';
import { PlanningPlaceholder } from '../../modules/planning';
import { FieldworkPlaceholder } from '../../modules/fieldwork';
import { WrapUpPlaceholder } from '../../modules/wrap-up';
import { DashboardsPlaceholder } from '../../modules/dashboards';
import { Eye, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { currentPhase } = useNavigation();
  const { isImpersonating, currentUser, realUser, exitImpersonation } = useUserSession();

  const renderActiveModule = () => {
    switch (currentPhase) {
      case 'reporting':
        return <ReportingModule />;
      case 'pre-planning':
        return <PrePlanningPlaceholder />;
      case 'planning':
        return <PlanningPlaceholder />;
      case 'fieldwork':
        return <FieldworkPlaceholder />;
      case 'wrap-up':
        return <WrapUpPlaceholder />;
      case 'dashboards':
        return <DashboardsPlaceholder />;
      default:
        return <ReportingModule />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      <Header />

      {/* Active Impersonation Persistent Banner */}
      {isImpersonating && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FCD34D',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#92400E',
            fontWeight: 600,
            zIndex: 99
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706'
              }}
            >
              <Eye size={13} strokeWidth={2.5} />
            </div>
            <span>
              Impersonation Mode: You are viewing as <strong>{currentUser.name}</strong> ({currentUser.title || currentUser.role}) — queue and workflow actions are scoped strictly to this user's assigned audits.
            </span>
            <span style={{ fontSize: '11px', color: '#B45309' }}>
              (Signed in as: {realUser.name})
            </span>
          </div>

          <button
            onClick={exitImpersonation}
            style={{
              backgroundColor: '#B45309',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '5px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#92400E'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#B45309'; }}
          >
            <X size={12} strokeWidth={2.5} />
            Exit Impersonation
          </button>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        {renderActiveModule()}
      </main>
    </div>
  );
};
