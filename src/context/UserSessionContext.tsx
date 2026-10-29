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
  isAdmin: false,
  title: 'Global Audit Administrator & IT Lead',
  function: 'IT',
  location: 'New Brunswick, NJ (US)',
  initials: 'TN'
};

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realUser, setRealUser] = useState<UserSession>(DEFAULT_REAL_USER);
  const [impersonatedUser, setImpersonatedUser] = useState<UserSession | null>(null);
  const [activeRoleId, setActiveRoleId] = useState<string>('assigned');
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

        // 1. Index systemusers by email, domainname, username prefix, and systemuserid for fast lookup
        const normalizeGuid = (val: any): string => {
          if (!val) return '';
          if (typeof val === 'object') {
            const candidate = val.systemuserid || val.id || val._id || val.guid;
            if (candidate) return String(candidate).toLowerCase().replace(/[{}]/g, '').trim();
            return '';
          }
          const s = String(val).trim();
          if (s.startsWith('[object')) return '';
          return s.toLowerCase().replace(/[{}]/g, '').trim();
        };

        const userByEmail = new Map<string, any>();
        const userById = new Map<string, any>();
        liveUsersRaw.forEach((u: any) => {
          const em = String(u.internalemailaddress || '').toLowerCase().trim();
          if (em) {
            userByEmail.set(em, u);
            if (em.includes('@')) {
              const emPrefix = em.split('@')[0]?.trim();
              if (emPrefix && !userByEmail.has(emPrefix)) userByEmail.set(emPrefix, u);
            }
          }
          const dom = String(u.domainname || '').toLowerCase().trim();
          if (dom) {
            if (!userByEmail.has(dom)) userByEmail.set(dom, u);
            if (dom.includes('\\')) {
              const part = dom.split('\\').pop()?.trim();
              if (part && !userByEmail.has(part)) userByEmail.set(part, u);
            }
            if (dom.includes('@')) {
              const part = dom.split('@')[0]?.trim();
              if (part && !userByEmail.has(part)) userByEmail.set(part, u);
            }
          }
          const uid = normalizeGuid(u.systemuserid);
          if (uid) userById.set(uid, u);
        });

        const searchEmail = activeEmail.toLowerCase().trim();
        const searchUserPrefix = searchEmail.includes('@') ? searchEmail.split('@')[0] : searchEmail;

        const matchedRealSysUser =
          userByEmail.get(searchEmail) ||
          userByEmail.get(searchUserPrefix) ||
          liveUsersRaw.find((u: any) => {
            const uEmail = String(u.internalemailaddress || '').toLowerCase().trim();
            const uDom = String(u.domainname || '').toLowerCase().trim();
            return (
              (uEmail && (uEmail === searchEmail || uEmail.startsWith(searchUserPrefix + '@'))) ||
              (uDom && (uDom === searchEmail || uDom.endsWith('\\' + searchUserPrefix) || uDom.startsWith(searchUserPrefix + '@')))
            );
          }) ||
          liveUsersRaw.find((u: any) =>
            u.fullname && activeName && u.fullname.toLowerCase().includes(activeName.toLowerCase().split(' ')[0])
          );

        const resolvedRealUserId = normalizeGuid(matchedRealSysUser?.systemuserid);
        const resolvedRealEmail = String(
          matchedRealSysUser?.internalemailaddress || matchedRealSysUser?.domainname || activeEmail || ''
        ).toLowerCase().trim();

        // Helper to extract admin GUID, email, domain, and display text from various Dataverse representations
        const resolveAdminDetails = (adm: any) => {
          let guid = '';
          let email = '';
          let domain = '';
          let name = '';

          const rawLookup = adm.iar_admin || adm.iar_Admin;
          if (rawLookup && typeof rawLookup === 'object') {
            guid = normalizeGuid(rawLookup);
            email = String(rawLookup.internalemailaddress || '').toLowerCase().trim();
            domain = String(rawLookup.domainname || '').toLowerCase().trim();
            name = String(rawLookup.fullname || '').trim();
          }

          if (!guid) {
            guid = normalizeGuid(
              getProp(adm, '_iar_admin_value', '_iar_Admin_value', 'iar_admin_value', 'iar_adminid')
            );
          }

          if (guid && !email) {
            const sysUser = userById.get(guid);
            if (sysUser) {
              email = String(sysUser.internalemailaddress || sysUser.domainname || '').toLowerCase().trim();
              domain = String(sysUser.domainname || '').toLowerCase().trim();
              name = name || String(sysUser.fullname || '').trim();
            }
          }

          const adminIdText = String(
            getProp(adm, 'iar_administratorid', 'iar_AdministratorId', 'iar_name', 'name', 'email') || ''
          ).trim();
          if (!email && adminIdText.includes('@')) {
            email = adminIdText.toLowerCase().trim();
          }
          if (!name && adminIdText && !adminIdText.includes('@')) {
            name = adminIdText;
          }

          return { guid, email, domain, name, adminIdText };
        };

        // Strictly check Dataverse table iar_administratorses (active records only, no hardcoded emails)
        let isUserAdmin = false;
        if (liveAdmins.length > 0) {
          isUserAdmin = liveAdmins.some((a: any) => {
            // 1. Status check: only skip if explicitly marked inactive
            const state = a.statecode;
            const isInactive = state === 1 || state === '1' || state === 'Inactive' || state === 'inactive';
            if (isInactive) return false;

            const { guid: adminGuid, email: adminEmail, domain: adminDomain, adminIdText } = resolveAdminDetails(a);

            // 2. Direct match by GUID if resolved
            if (resolvedRealUserId && adminGuid && adminGuid === resolvedRealUserId) {
              return true;
            }

            // 3. Direct match by email or domain
            const targetEmail = activeEmail.toLowerCase().trim();
            const resolvedEmail = resolvedRealEmail.toLowerCase().trim();
            if (adminEmail && (adminEmail === targetEmail || adminEmail === resolvedEmail)) {
              return true;
            }
            if (adminDomain && (adminDomain === targetEmail || adminDomain === resolvedEmail)) {
              return true;
            }

            // 4. Match prefix if username (e.g. TN4)
            if (searchUserPrefix) {
              if (adminEmail && adminEmail.split('@')[0] === searchUserPrefix) return true;
              if (adminDomain && (adminDomain.split('@')[0] === searchUserPrefix || adminDomain.endsWith('\\' + searchUserPrefix))) return true;
            }

            // 5. Match by primary column text (iar_administratorid)
            if (adminIdText) {
              const cleanAdminIdText = adminIdText.toLowerCase().trim();
              if (cleanAdminIdText === targetEmail || cleanAdminIdText === resolvedEmail) {
                return true;
              }
              if (searchUserPrefix && (cleanAdminIdText === searchUserPrefix || cleanAdminIdText.includes(searchUserPrefix))) {
                return true;
              }
            }

            return false;
          });
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
            userId: matchedRealSysUser?.systemuserid || prev.userId,
            isAdmin: isUserAdmin,
            role: isUserAdmin ? 'Global Audit Administrator' : (realRoleName || prev.role),
            baseRole: realRoleDetails.baseRole as any,
            function: (realRoleDetails.domain === 'FinOps' ? 'FinOps' : 'IT') as any
          }));
        }

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
          const roleLabelSuffix =
            roleDetails.baseRole === 'auditor'
              ? 'Staff Auditor'
              : roleDetails.baseRole === 'team-coordinator'
              ? 'Team Coordinator'
              : roleDetails.baseRole === 'director'
              ? 'Audit Director'
              : roleDetails.baseRole === 'vp'
              ? 'Vice President'
              : 'Audit Manager';
          const roleTitle =
            roleName ||
            tmRole?.iar_rolenamename ||
            `${roleDetails.domain === 'FinOps' ? 'FinOps Audit' : 'IT Audit'} ${roleLabelSuffix}`;

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
          const state = adm.statecode;
          const isInactive = state === 1 || state === '1' || state === 'Inactive' || state === 'inactive';
          if (isInactive) return;

          const { guid: adminGuid, email: resolvedAdmEmail, name: resolvedAdmName, adminIdText } = resolveAdminDetails(adm);
          const admEmail = resolvedAdmEmail || (adminIdText.includes('@') ? adminIdText.toLowerCase().trim() : '');

          if (admEmail) {
            if (distinctAuditorsMap.has(admEmail)) {
              const existing = distinctAuditorsMap.get(admEmail)!;
              existing.isAdmin = true;
              existing.role = 'Global Audit Administrator';
            } else {
              const admSysUser = userByEmail.get(admEmail) || (adminGuid ? userById.get(adminGuid) : null);
              const admName = admSysUser?.fullname || resolvedAdmName || admEmail.split('@')[0];
              const admInitials =
                (admSysUser?.firstname?.[0] || '') + (admSysUser?.lastname?.[0] || '') ||
                admName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

              distinctAuditorsMap.set(admEmail, {
                userId: admSysUser?.systemuserid || adminGuid || adm.iar_administratorsid || admEmail,
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
    if (activeRoleId === 'assigned') {
      return {
        id: 'assigned',
        label: 'Assigned Role',
        category: 'Case-Based',
        scope: 'Engagement-Driven',
        domain: 'All',
        baseRole: 'manager'
      };
    }
    return APPLICATION_ROLES.find(r => r.id === activeRoleId) || APPLICATION_ROLES[2];
  }, [activeRoleId]);

  const startImpersonation = (targetUser: UserSession) => {
    setImpersonatedUser(targetUser);
    // Use 'assigned' by default so each engagement dynamically resolves the impersonated user's security assignment on that engagement
    setActiveRoleId('assigned');
  };

  const exitImpersonation = () => {
    setImpersonatedUser(null);
    // Reset role to dynamic assigned role
    setActiveRoleId('assigned');
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
