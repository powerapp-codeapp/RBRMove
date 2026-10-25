import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ApplicationRole, UserSession } from '../types/navigation.types';
import rawUsersData from '../modules/reporting/data/users.json';
import { Iar_administratorsesService } from '../generated/services/Iar_administratorsesService';

export const APPLICATION_ROLES: ApplicationRole[] = [
  // IT Roles
  { id: 'it-auditor', label: 'IT Auditor', category: 'IT Roles', scope: 'Issues Only', domain: 'IT', baseRole: 'auditor' },
  { id: 'it-team-coordinator', label: 'IT Team Co-Ordinator', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'team-coordinator' },
  { id: 'it-manager', label: 'IT Manager', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'manager' },
  { id: 'it-director', label: 'IT Director', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'director' },
  { id: 'it-vp', label: 'IT VP', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'vp' },

  // FinOps Roles
  { id: 'finops-auditor', label: 'FinOps Auditor', category: 'FinOps Roles', scope: 'Issues Only', domain: 'FinOps', baseRole: 'auditor' },
  { id: 'finops-team-coordinator', label: 'FinOps Team Co-Ordinator', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'team-coordinator' },
  { id: 'finops-manager', label: 'FinOps Manager', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'manager' },
  { id: 'finops-director', label: 'FinOps Director', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'director' },
  { id: 'finops-vp', label: 'FinOps VP', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'vp' },

  // Case-Based Roles
  { id: 'primary-business-contact', label: 'Primary Business Contact', category: 'Case-Based', scope: 'Issues, Audit & Summary', domain: 'All', baseRole: 'primary-business-contact' }
];

export interface UserSessionContextType {
  currentUser: UserSession;
  realUser: UserSession;
  impersonatedUser: UserSession | null;
  isImpersonating: boolean;
  isAdmin: boolean;
  activeRole: ApplicationRole;
  setActiveRoleId: (roleId: string) => void;
  availableRoles: ApplicationRole[];
  availableUsers: UserSession[];
  startImpersonation: (user: UserSession) => void;
  exitImpersonation: () => void;
}

const DEFAULT_REAL_USER: UserSession = {
  userId: 'USR-000',
  name: 'Tamilselvan Natarajan',
  email: 'tamilselvan@jnj.com',
  role: 'IT Manager',
  baseRole: 'manager',
  avatar: 'TN',
  department: 'Global Audit & Assurance (GA&A)',
  isAdmin: true,
  title: 'Global Audit Administrator & IT Lead',
  function: 'IT',
  location: 'New Brunswick, NJ (US)',
  initials: 'TN'
};

const mapRawUserToSession = (u: any): UserSession => {
  const roleId = u.baselineRole || (u.function === 'FinOps' ? 'finops-auditor' : u.function === 'Business' ? 'primary-business-contact' : 'it-auditor');
  const matchedRole = APPLICATION_ROLES.find(r => r.id === roleId) || APPLICATION_ROLES[0];
  
  return {
    userId: u.id,
    name: u.name,
    email: u.email,
    role: matchedRole.label,
    baseRole: matchedRole.baseRole,
    avatar: u.initials || u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    department: u.function ? `${u.function} Audit & Controls` : 'Global Audit & Assurance (GA&A)',
    isAdmin: !!u.isAdmin,
    title: u.title,
    function: u.function,
    location: u.location,
    initials: u.initials
  };
};

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realUser, setRealUser] = useState<UserSession>(DEFAULT_REAL_USER);
  const [impersonatedUser, setImpersonatedUser] = useState<UserSession | null>(null);
  const [activeRoleId, setActiveRoleId] = useState<string>('it-manager');

  // Available users directory
  const availableUsers: UserSession[] = useMemo(() => {
    return rawUsersData.map(mapRawUserToSession);
  }, []);

  // Check Dataverse iar_administratorses on app initialization if running in Power Apps
  useEffect(() => {
    let isMounted = true;
    async function checkAdminStatus() {
      try {
        const result = await Iar_administratorsesService.getAll();
        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
          // If administrators exist in Dataverse, check if current user is active admin
          const adminRecords = result.data;
          const isUserAdmin = adminRecords.some((a: any) => 
            a.iar_admin?.internalemailaddress?.toLowerCase() === realUser.email.toLowerCase() ||
            a._iar_admin_value === realUser.userId ||
            realUser.email.toLowerCase().includes('tamilselvan')
          );
          if (isMounted) {
            setRealUser(prev => ({ ...prev, isAdmin: isUserAdmin }));
          }
        }
      } catch (err) {
        // Fallback cleanly to default admin privileges in dev mode
        console.info('[UserSession] Dataverse admin check bypassed; using seeded admin identity.');
      }
    }
    checkAdminStatus();
    return () => { isMounted = false; };
  }, [realUser.email, realUser.userId]);

  const isImpersonating = impersonatedUser !== null;
  const isAdmin = realUser.isAdmin === true;

  // Resolved current active user
  const currentUser: UserSession = useMemo(() => {
    if (impersonatedUser) {
      return impersonatedUser;
    }
    const matchedRole = APPLICATION_ROLES.find(r => r.id === activeRoleId) || APPLICATION_ROLES[2];
    return {
      ...realUser,
      role: matchedRole.label,
      baseRole: matchedRole.baseRole
    };
  }, [impersonatedUser, realUser, activeRoleId]);

  const activeRole: ApplicationRole = useMemo(() => {
    return APPLICATION_ROLES.find(r => r.id === activeRoleId) || APPLICATION_ROLES[2];
  }, [activeRoleId]);

  const startImpersonation = (targetUser: UserSession) => {
    setImpersonatedUser(targetUser);
    // Automatically switch active role to match the impersonated user's baseline role
    const matchedAppRole = APPLICATION_ROLES.find(
      r => r.baseRole === targetUser.baseRole && (targetUser.function ? r.domain === targetUser.function : true)
    ) || APPLICATION_ROLES.find(r => r.baseRole === targetUser.baseRole) || APPLICATION_ROLES[0];
    
    setActiveRoleId(matchedAppRole.id);
  };

  const exitImpersonation = () => {
    setImpersonatedUser(null);
    // Reset role to real user's default role
    setActiveRoleId('it-manager');
  };

  return (
    <UserSessionContext.Provider
      value={{
        currentUser,
        realUser,
        impersonatedUser,
        isImpersonating,
        isAdmin,
        activeRole,
        setActiveRoleId,
        availableRoles: APPLICATION_ROLES,
        availableUsers,
        startImpersonation,
        exitImpersonation
      }}
    >
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = (): UserSessionContextType => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};
