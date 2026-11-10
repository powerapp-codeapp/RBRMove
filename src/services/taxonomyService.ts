// ==============================================================================
// Taxonomy Service
// Johnson & Johnson Internal Audit Reporting (IAR)
// Dynamically fetches and indexes Taxonomies from Dataverse tables:
//   - iar_taxonomiesmasters (Taxonomies Master Categories)
//   - iar_taxonomieses (Taxonomy Values/Items)
// Connects UI dropdowns using normalized logic keys.
// ==============================================================================

import { Iar_taxonomiesmastersService } from '../generated/services/Iar_taxonomiesmastersService';
import { Iar_taxonomiesesService } from '../generated/services/Iar_taxonomiesesService';
import { useState, useEffect } from 'react';

export interface TaxonomyOption {
  value: string;
  label: string;
  guid: string;
  code?: string;
}

export type TaxonomyMasterMap = Map<string, TaxonomyOption[]>;

// In-memory cache
let _cachedTaxonomyMap: TaxonomyMasterMap | null = null;
let _cachedGuidToValueMap: Map<string, string> = new Map();
let _cachedValueToGuidMap: Map<string, string> = new Map();
let _fetchPromise: Promise<TaxonomyMasterMap> | null = null;
const _listeners = new Set<(map: TaxonomyMasterMap) => void>();

/**
 * Normalizes a taxonomy logic key or name for flexible, environment-agnostic matching.
 * Examples:
 *   'TAX-ISSUE-TYPE' -> 'issuetype'
 *   'ISSUE_TYPE'     -> 'issuetype'
 *   'Issue Type'     -> 'issuetype'
 */
export function normalizeLogicKey(key: string): string {
  if (!key) return '';
  return String(key)
    .toLowerCase()
    .trim()
    .replace(/^tax-?/, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Known semantic aliases mapping alternate names to standardized logic keys
 */
const LOGIC_KEY_ALIASES: Record<string, string[]> = {
  issuetype: ['issuetype', 'taxissuetype'],
  issuecausetype: ['issuecausetype', 'rootcausetype', 'causetype', 'taxissuecausetype'],
  criticality: ['criticality', 'issuecriticality', 'taxcriticality'],
  issuesource: ['issuesource', 'issuefindingsource', 'findingsource', 'taxissuesource'],
  keytheme: ['keytheme', 'theme', 'taxkeytheme'],
  processarea: ['processarea', 'area', 'accountableprocessarea', 'taxprocessarea'],
  accountablefunction: ['accountablefunction', 'auditfunction', 'function', 'taxauditfunction'],
  itassetaccountablesector: ['itassetaccountablesector', 'accountablesector', 'itassetsector', 'taxitassetsector'],
  impactedregion: ['impactedregion', 'region', 'taximpactedregion'],
  impactedsector: ['impactedsector', 'sector', 'taximpactedsector'],
  impactedmrc: ['impactedmrc', 'impactmrc', 'mrc', 'taximpactedmrc'],
  quarterimpacted: ['quarterimpacted', 'quarter', 'taxquarterimpacted'],
  repeatfinding: ['repeatfinding', 'booleanflag', 'taxbooleanflag', 'repeat']
};

function extractArray(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.value)) return res.value;
  if (res.data && Array.isArray(res.data.value)) return res.data.value;
  return [];
}

function normalizeGuid(val: any): string {
  if (!val) return '';
  if (typeof val === 'object') {
    const candidate = val.iar_taxonomiesmasterid || val.iar_taxonomiesid || val.id || val._id || val.guid;
    if (candidate) return String(candidate).toLowerCase().replace(/[{}]/g, '').trim();
    return '';
  }
  const s = String(val).trim();
  if (s.startsWith('[object')) return '';
  return s.toLowerCase().replace(/[{}]/g, '').trim();
}

/**
 * Fetches all Taxonomy Masters and Taxonomy Items from Dataverse and builds indexed options map.
 */
export async function loadTaxonomiesFromDataverse(forceReload = false): Promise<TaxonomyMasterMap> {
  if (_cachedTaxonomyMap && !forceReload) {
    return _cachedTaxonomyMap;
  }

  if (_fetchPromise && !forceReload) {
    return _fetchPromise;
  }

  _fetchPromise = (async () => {
    try {
      const [mastersRes, itemsRes] = await Promise.allSettled([
        Iar_taxonomiesmastersService.getAll(),
        Iar_taxonomiesesService.getAll()
      ]);

      const rawMasters = mastersRes.status === 'fulfilled' ? extractArray(mastersRes.value) : [];
      const rawItems = itemsRes.status === 'fulfilled' ? extractArray(itemsRes.value) : [];

      // Filter active masters
      const activeMasters = rawMasters.filter((m: any) => {
        const state = m.statecode;
        return state !== 1 && state !== '1' && state !== 'Inactive' && state !== 'inactive';
      });

      // Filter active items
      const activeItems = rawItems.filter((t: any) => {
        const state = t.statecode;
        return state !== 1 && state !== '1' && state !== 'Inactive' && state !== 'inactive';
      });

      // Build master ID / GUID -> Master info map
      const masterByGuid = new Map<string, { id: string; name: string; masterId: string }>();
      const masterKeysMap = new Map<string, string[]>(); // masterGuid -> array of normalized keys

      activeMasters.forEach((m: any) => {
        const guid = normalizeGuid(m.iar_taxonomiesmasterid || m.id);
        const name = String(m.iar_name || '').trim();
        const masterId = String(m.iar_masterid || '').trim();

        if (guid) {
          masterByGuid.set(guid, { id: guid, name, masterId });
        }

        const keys: string[] = [];
        if (name) keys.push(normalizeLogicKey(name));
        if (masterId) keys.push(normalizeLogicKey(masterId));

        if (guid) {
          masterKeysMap.set(guid, keys);
        }
      });

      // Group items by master GUID
      const itemsByMasterGuid = new Map<string, TaxonomyOption[]>();
      const guidToVal = new Map<string, string>();
      const valToGuid = new Map<string, string>();

      activeItems.forEach((item: any) => {
        const itemGuid = normalizeGuid(item.iar_taxonomiesid || item.id);
        const itemValue = String(item.iar_taxonomyvalue || item.name || '').trim();
        const itemCode = String(item.iar_taxonomyid || '').trim();

        if (!itemValue) return;

        // Resolve parent master GUID
        let masterGuid = normalizeGuid(
          item._iar_mastername_value ||
          item._iar_MasterName_value ||
          item.iar_mastername ||
          item.iar_MasterName
        );

        if (!masterGuid && item.iar_mastername && typeof item.iar_mastername === 'object') {
          masterGuid = normalizeGuid(item.iar_mastername.iar_taxonomiesmasterid || item.iar_mastername.id);
        }

        const opt: TaxonomyOption = {
          value: itemValue,
          label: itemValue,
          guid: itemGuid,
          code: itemCode
        };

        if (itemGuid) {
          guidToVal.set(itemGuid, itemValue);
          valToGuid.set(`${masterGuid}:${itemValue.toLowerCase()}`, itemGuid);
          valToGuid.set(itemValue.toLowerCase(), itemGuid);
        }

        if (masterGuid) {
          if (!itemsByMasterGuid.has(masterGuid)) {
            itemsByMasterGuid.set(masterGuid, []);
          }
          itemsByMasterGuid.get(masterGuid)!.push(opt);
        }
      });

      // Build logic-key indexed options map
      const masterMap: TaxonomyMasterMap = new Map();

      // Index by master GUID, name, masterId, and normalized keys
      itemsByMasterGuid.forEach((options, mGuid) => {
        const keys = masterKeysMap.get(mGuid) || [];
        const mInfo = masterByGuid.get(mGuid);

        masterMap.set(mGuid, options);

        if (mInfo?.name) {
          masterMap.set(mInfo.name.toLowerCase().trim(), options);
        }
        if (mInfo?.masterId) {
          masterMap.set(mInfo.masterId.toLowerCase().trim(), options);
        }

        keys.forEach((k) => {
          if (k && !masterMap.has(k)) {
            masterMap.set(k, options);
          }
        });
      });

      // Also map via alias registry
      Object.entries(LOGIC_KEY_ALIASES).forEach(([canonicalKey, aliases]) => {
        let matchedOptions: TaxonomyOption[] | null = null;
        for (const alias of aliases) {
          if (masterMap.has(alias)) {
            matchedOptions = masterMap.get(alias)!;
            break;
          }
        }
        if (matchedOptions) {
          aliases.forEach((alias) => {
            if (!masterMap.has(alias)) {
              masterMap.set(alias, matchedOptions!);
            }
          });
          masterMap.set(canonicalKey, matchedOptions);
        }
      });

      _cachedTaxonomyMap = masterMap;
      _cachedGuidToValueMap = guidToVal;
      _cachedValueToGuidMap = valToGuid;

      _listeners.forEach((listener) => listener(masterMap));
      return masterMap;
    } catch (err) {
      console.warn('[TaxonomyService] Error loading taxonomies from Dataverse:', err);
      const emptyMap: TaxonomyMasterMap = new Map();
      _cachedTaxonomyMap = emptyMap;
      return emptyMap;
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

/**
 * Returns options for a given taxonomy key from the cached master map.
 * Returns empty array [] if not found or empty in Dataverse (no fallback items).
 */
export function getTaxonomyOptions(logicKey: string): TaxonomyOption[] {
  if (!_cachedTaxonomyMap || !logicKey) return [];

  const rawKey = logicKey.trim().toLowerCase();
  if (_cachedTaxonomyMap.has(rawKey)) {
    return _cachedTaxonomyMap.get(rawKey)!;
  }

  const normalized = normalizeLogicKey(logicKey);
  if (_cachedTaxonomyMap.has(normalized)) {
    return _cachedTaxonomyMap.get(normalized)!;
  }

  // Check aliases
  for (const [canonicalKey, aliases] of Object.entries(LOGIC_KEY_ALIASES)) {
    if (canonicalKey === normalized || aliases.includes(normalized)) {
      for (const a of aliases) {
        if (_cachedTaxonomyMap.has(a)) {
          return _cachedTaxonomyMap.get(a)!;
        }
      }
    }
  }

  return [];
}

/**
 * Resolves an item's GUID from value and master key
 */
export function resolveTaxonomyGuid(val?: string, masterKey?: string): string | null {
  if (!val || !val.trim()) return null;
  const clean = val.trim();
  const directGuid = normalizeGuid(clean);
  if (directGuid && directGuid.length === 36) return directGuid;

  if (masterKey) {
    const opts = getTaxonomyOptions(masterKey);
    const matched = opts.find(
      (o) => o.value.toLowerCase() === clean.toLowerCase() || o.code?.toLowerCase() === clean.toLowerCase()
    );
    if (matched?.guid) return matched.guid;
  }

  const lower = clean.toLowerCase();
  return _cachedValueToGuidMap.get(lower) || null;
}

/**
 * Resolves display value from a taxonomy GUID
 */
export function resolveTaxonomyValue(guid?: string): string | null {
  if (!guid) return null;
  const clean = normalizeGuid(guid);
  return _cachedGuidToValueMap.get(clean) || null;
}

/**
 * React Hook for consuming dynamic taxonomies in any view or component.
 */
export function useTaxonomies() {
  const [taxonomyMap, setTaxonomyMap] = useState<TaxonomyMasterMap>(_cachedTaxonomyMap || new Map());
  const [isLoading, setIsLoading] = useState(!_cachedTaxonomyMap);

  useEffect(() => {
    let isMounted = true;

    if (!_cachedTaxonomyMap) {
      setIsLoading(true);
      loadTaxonomiesFromDataverse().then((map) => {
        if (isMounted) {
          setTaxonomyMap(map);
          setIsLoading(false);
        }
      });
    }

    const handler = (newMap: TaxonomyMasterMap) => {
      if (isMounted) {
        setTaxonomyMap(newMap);
        setIsLoading(false);
      }
    };

    _listeners.add(handler);
    return () => {
      isMounted = false;
      _listeners.delete(handler);
    };
  }, []);

  const getOptions = (logicKey: string): TaxonomyOption[] => {
    if (!taxonomyMap || !logicKey) return [];

    const rawKey = logicKey.trim().toLowerCase();
    if (taxonomyMap.has(rawKey)) return taxonomyMap.get(rawKey)!;

    const normalized = normalizeLogicKey(logicKey);
    if (taxonomyMap.has(normalized)) return taxonomyMap.get(normalized)!;

    for (const [canonicalKey, aliases] of Object.entries(LOGIC_KEY_ALIASES)) {
      if (canonicalKey === normalized || aliases.includes(normalized)) {
        for (const a of aliases) {
          if (taxonomyMap.has(a)) return taxonomyMap.get(a)!;
        }
      }
    }

    return [];
  };

  return {
    taxonomyMap,
    isLoading,
    getOptions,
    reload: () => loadTaxonomiesFromDataverse(true)
  };
}

