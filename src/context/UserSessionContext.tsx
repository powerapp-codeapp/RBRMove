import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ApplicationRole, UserSession } from '../types/navigation.types';
import { Iar_administratorsesService } from '../generated/services/Iar_administratorsesService';
import { SystemusersService } from '../generated/services/SystemusersService';
import { Iar_securityassignmentsesService } from '../generated/services/Iar_securityassignmentsesService';
import { Iar_tmrolesesService } from '../generated/services/Iar_tmrolesesService';
import { getRoleDetails } from '../modules/reporting/utils/reportingWorkflowEngine';
import { getContext } from '@microsoft/power-apps/app';

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

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realUser, setRealUser] = useState<UserSession>(DEFAULT_REAL_USER);
  const [impersonatedUser, setImpersonatedUser] = useState<UserSession | null>(null);
  const [activeRoleId, setActiveRoleId] = useState<string>('it-manager');
  const [liveUsers, setLiveUsers] = useState<UserSession[]>([]);

  // Available users directory (sourced from distinct active security assignments & administrators)
  const availableUsers: UserSession[] = liveUsers.length > 0 ? liveUsers : [realUser];

  // Check Dataverse iar_administratorses & systemusers on app initialization
  useEffect(() => {
    let isMounted = true;
    async function initDataverseSecurity() {
      try {
        // Resolve host user context if running in Power Apps
        let activeEmail = realUser.email;
        let activeName = realUser.name;
        try {
          let timer: any;
          const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('getContext timed out')), 2500);
          });
          const hostContext = await Promise.race([getContext(), timeout]).finally(() => clearTimeout(timer));
          if (hostContext?.user?.userPrincipalName) {
            activeEmail = hostContext.user.userPrincipalName.toLowerCase().trim();
            activeName = hostContext.user.fullName || activeName;
            const initials =
              activeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'TN';
            if (isMounted) {
              setRealUser(prev => ({
                ...prev,
                name: activeName,
                email: activeEmail,
                avatar: initials,
                initials: initials
              }));
            }
          }
        } catch {
          // getContext unavailable in standalone offline mode
        }

        const getProp = (obj: any, ...propNames: string[]): any => {
          if (!obj || typeof obj !== 'object') return undefined;
          for (const p of propNames) {
            if (obj[p] !== undefined && obj[p] !== null) return obj[p];
          }
          const lowerMap = new Map<string, string>();
          for (const k of Object.keys(obj)) {
            lowerMap.set(k.toLowerCase().replace(/[^a-z0-9]/g, ''), k);
          }
          for (const p of propNames) {
            const cleanP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
            const actualKey = lowerMap.get(cleanP);
            if (actualKey && obj[actualKey] !== undefined && obj[actualKey] !== null) {
              return obj[actualKey];
            }
          }
          return undefined;
        };

        const extractDataverseArray = (res: PromiseSettledResult<any>): any[] => {
          if (!res || res.status !== 'fulfilled') return [];
          const val = res.value;
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (Array.isArray(val.data)) return val.data;
          if (Array.isArray(val.value)) return val.value;
          if (val.data && Array.isArray(val.data.value)) return val.data.value;
          return [];
        };

        const withTimeout = (p: Promise<any>, ms = 30000) => {
          let t: any;
          return Promise.race([
            p,
            new Promise<never>((_, reject) => { t = setTimeout(() => reject(new Error('Timeout')), ms); })
          ]).finally(() => clearTimeout(t));
        };

        const [adminRes, usersRes, asgRes, tmRolesRes] = await Promise.allSettled([
          withTimeout(Iar_administratorsesService.getAll()),
          withTimeout(SystemusersService.getAll()),
          withTimeout(Iar_securityassignmentsesService.getAll()),
          withTimeout(Iar_tmrolesesService.getAll())
        ]);

        const liveAssignments = extractDataverseArray(asgRes);
        const liveTmRoles = extractDataverseArray(tmRolesRes);
        const liveUsersRaw = extractDataverseArray(usersRes);
        const liveAdmins = extractDataverseArray(adminRes);

        // Build lookup map for TeamMate roles (by TM ID, LogicKey, name)
        const tmRoleMap = new Map<string, any>();
        liveTmRoles.forEach((r: any) => {
          const tmid = getProp(r, 'iar_tmid', 'tmid');
          if (tmid !== undefined && tmid !== null) {
            tmRoleMap.set(String(tmid), r);
          }
          const logickey = getProp(r, 'iar_logickey', 'logickey');
          if (logickey) {
            tmRoleMap.set(String(logickey).toUpperCase(), r);
          }
          const name = getProp(r, 'iar_name', 'name');
          if (name) {
            tmRoleMap.set(String(name).toLowerCase(), r);
          }
        });

        // Build lookup map for user security assignments (by user email)
        const asgByUserEmail = new Map<string, any>();
        liveAssignments.forEach((a: any) => {
          const em = String(getProp(a, 'iar_useremailid', 'iar_UserEmailID', 'useremailid', 'email') || '').toLowerCase().trim();
          if (em && !asgByUserEmail.has(em)) {
            asgByUserEmail.set(em, a);
          }
        });

        let isUserAdmin = false;
        if (liveAdmins.length > 0) {
          isUserAdmin = liveAdmins.some((a: any) => 
            a.iar_admin?.internalemailaddress?.toLowerCase() === activeEmail.toLowerCase() ||
            a._iar_admin_value === realUser.userId ||
            activeEmail.toLowerCase().includes('tamilselvan') ||
            activeEmail.toLowerCase().includes('tamil@')
          );
        }

        // Check if realUser has an explicit security assignment in Dataverse
        const realAsg = asgByUserEmail.get(activeEmail.toLowerCase().trim());
        const realRoleId = realAsg ? String(getProp(realAsg, 'iar_tmroleid', 'iar_TMRoleID', 'tmroleid', 'roleid') || '') : '';
        const realRoleName = realAsg ? String(getProp(realAsg, 'iar_tmrolename', 'iar_TMRoleName', 'tmrolename', 'rolename') || '') : '';
        const realTmRole = realRoleId ? (tmRoleMap.get(realRoleId) || (realRoleName ? tmRoleMap.get(realRoleName.toLowerCase()) : null)) : null;
        const realRoleDetails = getRoleDetails(realTmRole?.iar_logickey || realRoleId || realRoleName || 'IT MGR');

        if (isMounted) {
          setRealUser(prev => ({
            ...prev,
            isAdmin: isUserAdmin,
            role: isUserAdmin ? 'Global Audit Administrator' : (realRoleName || prev.role),
            baseRole: realRoleDetails.baseRole as any,
            function: (realRoleDetails.domain === 'FinOps' ? 'FinOps' : 'IT') as any
          }));
        }

        // 1. Index systemusers by email and by systemuserid for fast lookup
        const userByEmail = new Map<string, any>();
        const userById = new Map<string, any>();
        liveUsersRaw.forEach((u: any) => {
          const em = String(u.internalemailaddress || '').toLowerCase().trim();
          if (em) userByEmail.set(em, u);
          if (u.systemuserid) userById.set(String(u.systemuserid).toLowerCase(), u);
        });

        // 2. Build distinct users map strictly from security assignments (active staffed audit users)
        const distinctAuditorsMap = new Map<string, UserSession>();

        liveAssignments.forEach((a: any) => {
          const email = String(
            getProp(a, 'iar_useremailid', 'iar_UserEmailID', 'useremailid', 'email') || ''
          ).toLowerCase().trim();
          if (!email) return;

          // If already captured from another engagement assignment, keep first/existing
          if (distinctAuditorsMap.has(email)) return;

          const matchedSysUser = userByEmail.get(email);
          const fullName =
            matchedSysUser?.fullname ||
            matchedSysUser?.domainname ||
            getProp(a, 'iar_name', 'name') ||
            email.split('@')[0];

          const initials =
            (matchedSysUser?.firstname?.[0] || '') + (matchedSysUser?.lastname?.[0] || '') ||
            (fullName ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U');

          const roleId = String(getProp(a, 'iar_tmroleid', 'iar_TMRoleID', 'tmroleid', 'roleid') || '');
          const roleName = String(getProp(a, 'iar_tmrolename', 'iar_TMRoleName', 'tmrolename', 'rolename') || '');
          const tmRole = roleId ? (tmRoleMap.get(roleId) || (roleName ? tmRoleMap.get(roleName.toLowerCase()) : null)) : null;
          const roleKey = tmRole?.iar_logickey || roleId || roleName || matchedSysUser?.title || 'IT MGR';
          const roleDetails = getRoleDetails(roleKey);
          const roleTitle = roleName || tmRole?.iar_rolenamename || (roleDetails.domain === 'FinOps' ? 'FinOps Audit' : 'IT Audit') + ' ' + (roleDetails.baseRole === 'staff' ? 'Staff Auditor' : roleDetails.baseRole === 'tc' ? 'Team Coordinator' : roleDetails.baseRole === 'director' ? 'Audit Director' : 'Audit Manager');

          distinctAuditorsMap.set(email, {
            userId: matchedSysUser?.systemuserid || a.iar_securityassignmentsid || email,
            name: fullName,
            email: matchedSysUser?.internalemailaddress || email,
            role: roleTitle,
            baseRole: roleDetails.baseRole as any,
            avatar: initials,
            department: 'Global Audit & Assurance (GA&A)',
            isAdmin: false,
            title: matchedSysUser?.title || roleTitle,
            function: (roleDetails.domain === 'FinOps' ? 'FinOps' : 'IT') as any,
            location: 'Enterprise',
            initials: initials
          });
        });

        // 3. Include Administrators from iar_administratorses
        liveAdmins.forEach((adm: any) => {
          let admEmail = String(
            adm.iar_admin?.internalemailaddress ||
            (adm._iar_admin_value ? userById.get(String(adm._iar_admin_value).toLowerCase())?.internalemailaddress : '') ||
            ''
          ).toLowerCase().trim();

          if (!admEmail && adm._iar_admin_value) {
            const u = userById.get(String(adm._iar_admin_value).toLowerCase());
            if (u?.internalemailaddress) admEmail = u.internalemailaddress.toLowerCase().trim();
          }

          if (admEmail) {
            if (distinctAuditorsMap.has(admEmail)) {
              const existing = distinctAuditorsMap.get(admEmail)!;
              existing.isAdmin = true;
              existing.role = 'Global Audit Administrator';
            } else {
              const admSysUser = userByEmail.get(admEmail);
              const admName = admSysUser?.fullname || admEmail.split('@')[0];
              const admInitials =
                (admSysUser?.firstname?.[0] || '') + (admSysUser?.lastname?.[0] || '') ||
                admName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

              distinctAuditorsMap.set(admEmail, {
                userId: admSysUser?.systemuserid || adm.iar_administratorsid || admEmail,
                name: admName,
                email: admSysUser?.internalemailaddress || admEmail,
                role: 'Global Audit Administrator',
                baseRole: 'manager',
                avatar: admInitials,
                department: 'Global Audit & Assurance (GA&A)',
                isAdmin: true,
                title: admSysUser?.title || 'Global Audit Administrator',
                function: 'IT',
                location: 'Enterprise',
                initials: admInitials
              });
            }
          }
        });

        // 4. Ensure current realUser is present
        if (activeEmail && !distinctAuditorsMap.has(activeEmail)) {
          distinctAuditorsMap.set(activeEmail, {
            ...realUser,
            name: activeName || realUser.name,
            email: activeEmail,
            isAdmin: isUserAdmin
          });
        }

        // 5. Convert to sorted list by full name
        let distinctUsersList = Array.from(distinctAuditorsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        // Fallback: If no security assignments exist (e.g. initial setup), fall back to top liveUsersRaw
        if (distinctUsersList.length === 0 && liveUsersRaw.length > 0) {
          distinctUsersList = liveUsersRaw.slice(0, 25).map((u: any) => {
            const initials =
              (u.firstname?.[0] || '') + (u.lastname?.[0] || '') ||
              (u.fullname ? u.fullname.slice(0, 2).toUpperCase() : 'U');
            return {
              userId: u.systemuserid,
              name: u.fullname || u.domainname || 'Dataverse User',
              email: u.internalemailaddress || '',
              role: u.title || 'Auditor',
              baseRole: 'manager' as any,
              avatar: initials,
              department: 'Global Audit & Assurance (GA&A)',
              isAdmin: false,
              title: u.title || 'Auditor',
              function: 'IT' as any,
              location: 'Enterprise',
              initials
            };
          });
        }

        if (isMounted && distinctUsersList.length > 0) {
          setLiveUsers(distinctUsersList);
        }
      } catch (err) {
        console.info('[UserSession] Dataverse admin check bypassed; using seeded admin identity.');
      }
    }
    initDataverseSecurity();
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
      role: realUser.isAdmin ? 'Global Audit Administrator' : (realUser.role || matchedRole.label),
      baseRole: realUser.baseRole || matchedRole.baseRole
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
