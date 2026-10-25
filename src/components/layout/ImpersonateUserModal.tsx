import React, { useState, useMemo } from 'react';
import { Search, X, UserCheck, Shield, MapPin, Briefcase, Check } from 'lucide-react';
import { useUserSession } from '../../context/UserSessionContext';
import type { UserSession } from '../../types/navigation.types';

interface ImpersonateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImpersonateUserModal: React.FC<ImpersonateUserModalProps> = ({ isOpen, onClose }) => {
  const { availableUsers, currentUser, realUser, isImpersonating, startImpersonation, exitImpersonation } = useUserSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'IT' | 'FinOps' | 'Business'>('all');

  const filteredUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      // Function Category Filter
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'IT' && u.function !== 'IT') return false;
        if (selectedFilter === 'FinOps' && u.function !== 'FinOps') return false;
        if (selectedFilter === 'Business' && u.function !== 'Business') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.title && u.title.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q)) ||
          (u.location && u.location.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [availableUsers, selectedFilter, searchQuery]);

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
          width: '640px',
          maxWidth: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22)',
          border: '1px solid #D8D8D8',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
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

        {/* Search & Category Filter Bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F1F5F9',
              borderRadius: '6px',
              padding: '6px 12px',
              border: '1px solid #CBD5E1'
            }}
          >
            <Search size={15} color="#64748B" />
            <input
              type="text"
              placeholder="Search by name, email, title, or location..."
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

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {(['all', 'IT', 'FinOps', 'Business'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '14px',
                  fontSize: '11px',
                  fontWeight: selectedFilter === cat ? 700 : 500,
                  border: 'none',
                  backgroundColor: selectedFilter === cat ? '#000099' : '#F1F5F9',
                  color: selectedFilter === cat ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat === 'all' ? 'All Personas' : `${cat} Team`}
              </button>
            ))}
            {isImpersonating && (
              <button
                onClick={() => {
                  exitImpersonation();
                  onClose();
                }}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  borderRadius: '14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFBEB',
                  color: '#B45309',
                  cursor: 'pointer'
                }}
              >
                Reset to My Account
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748B', fontSize: '13px' }}>
              No users found matching "{searchQuery}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredUsers.map((user) => {
                const isCurrentActive = currentUser.email.toLowerCase() === user.email.toLowerCase();
                const isRealAdmin = realUser.email.toLowerCase() === user.email.toLowerCase();

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: user.function === 'IT' ? '#EEF2FF' : user.function === 'FinOps' ? '#FFF1F2' : '#F1F5F9',
                          color: user.function === 'IT' ? '#000099' : user.function === 'FinOps' ? '#EB1700' : '#475569',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid currentColor',
                          flexShrink: 0
                        }}
                      >
                        {user.avatar || user.initials || 'U'}
                      </div>

                      {/* Details */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            {user.name}
                          </span>
                          {isRealAdmin && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#EFF6FF',
                                color: '#000099',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              <Shield size={10} />
                              ADMIN
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: user.function === 'IT' ? '#F0FDF4' : user.function === 'FinOps' ? '#FEF2F2' : '#F8FAFC',
                              color: user.function === 'IT' ? '#087D0D' : user.function === 'FinOps' ? '#EB1700' : '#64748B',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(0,0,0,0.06)'
                            }}
                          >
                            {user.function || 'Audit'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '11px', color: '#64748B' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Briefcase size={12} color="#94A3B8" />
                            {user.title || user.role}
                          </span>
                          <span>•</span>
                          <span>{user.email}</span>
                          {user.location && (
                            <>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={11} color="#94A3B8" />
                                {user.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Status */}
                    <div>
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
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#1E293B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#000099';
                            e.currentTarget.style.color = '#000099';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.color = '#1E293B';
                          }}
                        >
                          <UserCheck size={12} />
                          Impersonate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748B'
          }}
        >
          <span>
            Logged in as <strong>{realUser.name}</strong> ({realUser.email})
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '5px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
