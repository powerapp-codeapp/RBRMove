import React, { useState, useMemo } from 'react';
import { Search, X, UserCheck, Check } from 'lucide-react';
import { useUserSession } from '../../context/UserSessionContext';
import type { UserSession } from '../../types/navigation.types';

interface ImpersonateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImpersonateUserModal: React.FC<ImpersonateUserModalProps> = ({ isOpen, onClose }) => {
  const { availableUsers, currentUser, realUser, isImpersonating, startImpersonation, exitImpersonation } = useUserSession();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [availableUsers, searchQuery]);

  if (!isOpen) return null;

  const handleSelectUser = (user: UserSession) => {
    if (user.email === realUser.email) {
      exitImpersonation();
    } else {
      startImpersonation(user);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '580px',
          maxWidth: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22)',
          border: '1px solid #D8D8D8',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#000099',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Impersonate Enterprise User
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                View the Audit Queue and review permissions exactly as the selected user.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
              borderRadius: '4px'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F1F5F9',
              borderRadius: '6px',
              padding: '7px 12px',
              border: '1px solid #CBD5E1'
            }}
          >
            <Search size={15} color="#64748B" />
            <input
              type="text"
              placeholder="Search by name and email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: '#1E293B'
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isImpersonating && (
            <button
              onClick={() => {
                exitImpersonation();
                onClose();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: '1px solid #FCD34D',
                backgroundColor: '#FFFBEB',
                color: '#B45309',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Reset to My Account
            </button>
          )}
        </div>

        {/* User List with Lean Scrollbar */}
        <div
          className="slim-light-scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748B', fontSize: '13px' }}>
              No users found matching "{searchQuery}".
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isCurrentActive = currentUser.email.toLowerCase() === user.email.toLowerCase();

              return (
                <div
                  key={user.userId || user.email}
                  onClick={() => handleSelectUser(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isCurrentActive ? '#EFF6FF' : '#FFFFFF',
                    border: isCurrentActive ? '1.5px solid #000099' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentActive) {
                      e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentActive) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#000099',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid #000099',
                        flexShrink: 0
                      }}
                    >
                      {user.avatar || user.initials || 'U'}
                    </div>

                    {/* Name & Email */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#64748B',
                          marginTop: '1px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Impersonate Option */}
                  <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                    {isCurrentActive ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#000099',
                          backgroundColor: '#DBEAFE',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                        Active View
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUser(user);
                        }}
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#1E293B',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#000099';
                          e.currentTarget.style.color = '#000099';
                          e.currentTarget.style.backgroundColor = '#EFF6FF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.color = '#1E293B';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <UserCheck size={12} />
                        Impersonate
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
