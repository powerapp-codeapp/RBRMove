import React, { useState, useRef, useEffect } from 'react';
import { useUserSession } from '../../context/UserSessionContext';
import { ChevronDown, User, UserCheck, LogOut, Database } from 'lucide-react';
import { ImpersonateUserModal } from './ImpersonateUserModal';
import { DataverseDiagnosticsModal } from './DataverseDiagnosticsModal';
import {
  getCachedReportingPayload,
  subscribeToReportingData,
  fetchDataverseReportingData,
  type DataverseReportingPayload
} from '../../services/dataverseReportingService';

export const UserRoleMenu: React.FC = () => {
  const {
    currentUser,
    realUser,
    activeRole,
    isAdmin,
    isImpersonating,
    exitImpersonation
  } = useUserSession();

  const [isOpen, setIsOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [reportingData, setReportingData] = useState<DataverseReportingPayload | null>(getCachedReportingPayload());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToReportingData((payload) => {
      setReportingData(payload);
    });
    if (!getCachedReportingPayload()) {
      fetchDataverseReportingData().then(p => setReportingData(p)).catch(() => {});
    }
    return () => unsubscribe();
  }, []);

  const isLiveConnected = reportingData?.isLiveConnected ?? false;
  const diagnostics = reportingData?.diagnostics ?? null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const payload = await fetchDataverseReportingData();
      setReportingData(payload);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display role label: If admin (and not impersonating), show Admin; otherwise show user's resolved role or active persona
  const displayRoleTitle = isImpersonating
    ? (currentUser.role || activeRole.label)
    : isAdmin
      ? 'Global Audit Administrator'
      : (currentUser.role || activeRole.label);

  return (
    <>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="jnj-user-profile-button"
          title={isImpersonating ? `Viewing as: ${currentUser.name}` : `${currentUser.name} (${displayRoleTitle})`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: isImpersonating ? '#FFFBEB' : 'transparent',
            border: isImpersonating ? '1px solid #FCD34D' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: isImpersonating ? '1.5px solid #D97706' : '1.5px solid #000099',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isImpersonating ? '#D97706' : '#000099',
              backgroundColor: isImpersonating ? '#FEF3C7' : '#EFF6FF',
              fontWeight: 700,
              fontSize: '11px',
              flexShrink: 0,
            }}
          >
            {isImpersonating ? (
              <UserCheck size={14} strokeWidth={2.5} />
            ) : (
              currentUser.initials || currentUser.avatar || <User size={14} strokeWidth={2} />
            )}
          </div>

          <span
            className="jnj-user-profile-name"
            style={{ fontSize: 'var(--type-table-row-size, 13px)', fontWeight: 600, color: '#000000' }}
          >
            {currentUser.name}
          </span>

          {isAdmin && !isImpersonating && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                backgroundColor: '#EFF6FF',
                color: '#000099',
                padding: '1px 5px',
                borderRadius: '4px',
                letterSpacing: '0.4px',
                border: '1px solid #BFDBFE'
              }}
            >
              ADMIN
            </span>
          )}

          {isImpersonating && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                padding: '1px 5px',
                borderRadius: '4px',
                letterSpacing: '0.4px',
                border: '1px solid #FCD34D'
              }}
            >
              VIEWING AS
            </span>
          )}

          <ChevronDown size={14} color="#000000" />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '240px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              border: '1px solid #d8d8d8',
              zIndex: 1000,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {/* User Name */}
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#212121',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={currentUser.name}
            >
              {currentUser.name}
            </div>

            {/* Email beneath Name */}
            {currentUser.email && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#63666a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={currentUser.email}
              >
                {currentUser.email}
              </div>
            )}

            {/* Impersonation Option for Admin beneath Email */}
            {isAdmin && (
              <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                {isImpersonating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>
                      Logged in as: <strong>{realUser.name}</strong>
                    </div>
                    <button
                      onClick={() => {
                        exitImpersonation();
                        setIsOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px 0',
                        color: '#B45309',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      <LogOut size={13} />
                      Exit Impersonation
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsImpersonateModalOpen(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px 0',
                      color: '#000099',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    <UserCheck size={14} />
                    Impersonate User
                  </button>
                )}
              </div>
            )}

            {/* Dataverse Sync / Connection Status at bottom of user menu */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
              <div
                onClick={() => {
                  setIsOpen(false);
                  setIsDiagModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isLiveConnected ? '#ECFDF5' : '#FFFBEB',
                  border: `1px solid ${isLiveConnected ? '#A7F3D0' : '#FDE68A'}`,
                  transition: 'background-color 0.15s ease'
                }}
                title="Click to view Dataverse synchronization diagnostics"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={13} color={isLiveConnected ? '#087D0D' : '#B45309'} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isLiveConnected ? '#087D0D' : '#B45309',
                      fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
                    }}
                  >
                    {isLiveConnected ? 'Dataverse Live' : 'Local Dev Mode'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isLiveConnected ? '#047857' : '#92400E',
                    textDecoration: 'underline'
                  }}
                >
                  Diagnostics
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Impersonate User Modal */}
      <ImpersonateUserModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
      />

      {/* Dataverse Diagnostics Modal */}
      <DataverseDiagnosticsModal
        isOpen={isDiagModalOpen}
        onClose={() => setIsDiagModalOpen(false)}
        isLiveConnected={isLiveConnected}
        diagnostics={diagnostics}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </>
  );
};
