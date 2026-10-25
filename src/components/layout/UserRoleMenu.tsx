import React, { useState, useRef, useEffect } from 'react';
import { useUserSession } from '../../context/UserSessionContext';
import { ChevronDown, Check, User, Shield, UserCheck, LogOut } from 'lucide-react';
import { ImpersonateUserModal } from './ImpersonateUserModal';

export const UserRoleMenu: React.FC = () => {
  const {
    currentUser,
    realUser,
    activeRole,
    setActiveRoleId,
    availableRoles,
    isAdmin,
    isImpersonating,
    exitImpersonation
  } = useUserSession();

  const [isOpen, setIsOpen] = useState(false);
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itRoles = availableRoles.filter(r => r.category === 'IT Roles');
  const finOpsRoles = availableRoles.filter(r => r.category === 'FinOps Roles');
  const caseRoles = availableRoles.filter(r => r.category === 'Case-Based');

  return (
    <>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="jnj-user-profile-button"
          title={isImpersonating ? `Impersonating: ${currentUser.name}` : `Active Persona: ${activeRole.label}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: isImpersonating ? '#FFFBEB' : 'transparent',
            border: isImpersonating ? '1px solid #FCD34D' : '1px solid transparent',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: isImpersonating ? '1.5px solid #D97706' : '1.5px solid #212121',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isImpersonating ? '#D97706' : '#212121',
              backgroundColor: isImpersonating ? '#FEF3C7' : 'transparent',
              flexShrink: 0,
            }}
          >
            {isImpersonating ? <UserCheck size={14} strokeWidth={2.5} /> : <User size={15} strokeWidth={2} />}
          </div>
          <span className="jnj-user-profile-name" style={{ fontSize: 'var(--type-table-row-size, 13px)', fontWeight: 600, color: '#000000' }}>
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
              width: '300px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.14)',
              border: '1px solid #d8d8d8',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            {/* Header info */}
            <div style={{ padding: '12px 16px', backgroundColor: '#fafafc', borderBottom: '1px solid #d8d8d8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 'var(--type-table-row-title-size, 13px)', fontWeight: 800, color: '#212121' }}>
                  {currentUser.name}
                </div>
                {isAdmin && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: '#EFF6FF',
                      color: '#000099',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    <Shield size={10} />
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: 'var(--type-caption-size, 11px)', color: '#63666a', marginTop: '2px' }}>
                Active Persona: <strong style={{ color: '#000099' }}>{activeRole.label}</strong>
              </div>
              <div style={{ fontSize: 'var(--type-caption-size, 10px)', color: '#888b8d', marginTop: '1px' }}>
                {currentUser.department}
              </div>
            </div>

            {/* Impersonation Section for Global Administrators */}
            {isAdmin && (
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0', backgroundColor: isImpersonating ? '#FFFBEB' : '#F8FAFC' }}>
                {isImpersonating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={12} color="#D97706" />
                      Logged in as: <strong>{realUser.name}</strong>
                    </div>
                    <button
                      onClick={() => {
                        exitImpersonation();
                        setIsOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        backgroundColor: '#B45309',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <LogOut size={12} />
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
                      width: '100%',
                      padding: '7px 12px',
                      backgroundColor: '#000099',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#000077'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#000099'; }}
                  >
                    <UserCheck size={13} />
                    Impersonate User...
                  </button>
                )}
              </div>
            )}

            <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px 0' }}>
              {/* IT Roles */}
              <div style={{ padding: '6px 14px 2px', fontSize: 'var(--type-caption-size, 10px)', fontWeight: 800, color: '#000099', textTransform: 'uppercase' }}>
                IT Governance Roles
              </div>
              {itRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    setActiveRoleId(role.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 14px',
                    border: 'none',
                    backgroundColor: activeRole.id === role.id ? '#f1f4ff' : 'transparent',
                    color: activeRole.id === role.id ? '#000099' : '#212121',
                    fontSize: 'var(--type-caption-size, 12px)',
                    fontWeight: activeRole.id === role.id ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <span>{role.label}</span>
                  {activeRole.id === role.id && <Check size={14} color="#000099" />}
                </button>
              ))}

              {/* FinOps Roles */}
              <div style={{ padding: '8px 14px 2px', fontSize: 'var(--type-caption-size, 10px)', fontWeight: 800, color: '#eb1700', textTransform: 'uppercase' }}>
                FinOps Governance Roles
              </div>
              {finOpsRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    setActiveRoleId(role.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 14px',
                    border: 'none',
                    backgroundColor: activeRole.id === role.id ? '#f1f4ff' : 'transparent',
                    color: activeRole.id === role.id ? '#000099' : '#212121',
                    fontSize: 'var(--type-caption-size, 12px)',
                    fontWeight: activeRole.id === role.id ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <span>{role.label}</span>
                  {activeRole.id === role.id && <Check size={14} color="#000099" />}
                </button>
              ))}

              {/* Case-Based Roles */}
              <div style={{ padding: '8px 14px 2px', fontSize: 'var(--type-caption-size, 10px)', fontWeight: 800, color: '#63666a', textTransform: 'uppercase' }}>
                Business Contact Roles
              </div>
              {caseRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    setActiveRoleId(role.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 14px',
                    border: 'none',
                    backgroundColor: activeRole.id === role.id ? '#f1f4ff' : 'transparent',
                    color: activeRole.id === role.id ? '#000099' : '#212121',
                    fontSize: 'var(--type-caption-size, 12px)',
                    fontWeight: activeRole.id === role.id ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <span>{role.label}</span>
                  {activeRole.id === role.id && <Check size={14} color="#000099" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Impersonate User Modal */}
      <ImpersonateUserModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
      />
    </>
  );
};
