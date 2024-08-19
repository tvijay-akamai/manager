import { DateTime } from 'luxon';

import { isPast } from 'src/utilities/isPast';

import { ExcludedScope } from './CreateAPITokenDrawer';

export type Permission = [keyof typeof basePermNameMap, number];

export const basePerms = [
  'account',
  'child_account',
  'databases',
  'domains',
  'events',
  'firewall',
  'images',
  'ips',
  'linodes',
  'lke',
  'longview',
  'nodebalancers',
  'object_storage',
  'stackscripts',
  'volumes',
  'vpc',
] as const;

export const basePermNameMap = {
  account: 'Account',
  child_account: 'Child Account Access',
  databases: 'Databases',
  domains: 'Domains',
  events: 'Events',
  firewall: 'Firewalls',
  images: 'Images',
  ips: 'IPs',
  linodes: 'Linodes',
  lke: 'Kubernetes',
  longview: 'Longview',
  nodebalancers: 'NodeBalancers',
  object_storage: 'Object Storage',
  stackscripts: 'StackScripts',
  volumes: 'Volumes',
  vpc: 'VPCs',
} as const;

export const inverseLevelMap = ['none', 'read_only', 'read_write'];

export const levelMap = {
  create: 2,
  delete: 2,
  modify: 2,
  none: 0,
  read_only: 1,
  read_write: 2,
  view: 1,
};

const NO_SCOPE_SELECTION = -1;

const defaultScopeMap = (
  perms: typeof basePerms,
  isCreateFlow?: boolean
): Record<string, -1 | 0> =>
  perms.reduce(
    (obj, key) => ({ ...obj, [key]: isCreateFlow ? NO_SCOPE_SELECTION : 0 }),
    {}
  );

/**
 * This function accepts scopes strings as given by the API, which have the following format:
 * Either:
 * "linodes:delete,domains:modify,nodebalancers:modify,images:create,events:view,clients:view"
 * Or:
 * "linodes:delete domains:modify nodebalancers:modify images:create"
 *
 * It returns an array of 2-tuples in alphabetical order by scope name.
 *
 * Each 2-tuple has the format [<scopename>, <number>], where <number> is the permission level
 * of the scope. These are the permission levels in order:
 *
 * None: 0
 * ReadOnly: 1
 * ReadWrite: 2
 *
 * These are old permission levels which must be mapped to the new levels
 * None: 0
 * View: 1
 * Create: 2
 * Modify: 2
 * Delete: 2
 *
 * Each permission level gives a user access to all lower permission levels.
 */
const permRegex = new RegExp(/[, ]/);
export const scopeStringToPermTuples = (
  scopes: string,
  isCreateFlow?: boolean
): Permission[] => {
  if (scopes === '*') {
    return basePerms.map((perm) => [perm, 2] as Permission);
  }

  const scopeMap = scopes.split(permRegex).reduce((map, scopeStr) => {
    const [perm, level] = scopeStr.split(':');
    return {
      ...map,
      [perm]: levelMap[level as keyof typeof levelMap],
    };
  }, defaultScopeMap(basePerms, isCreateFlow));

  /**
   * So there are deprecated permission types that have been folded into a parent permission. So
   * tokens, clients, etc., are all now under account. However, could potentially still be tokens
   * with the old values (since some tokens never expire... great).
   *
   * So check the scopeMap (generated by the provided scopes) for one of these deprecated types;
   *  { account:read_only, tokens:create }
   * then compare that to the existing account level (say read_only) and update account with
   * the "higher" permission. Oh right, did I mention we have deprecated permission levels too?
   * So read above in Andrews comments about the deprecated levels.
   */
  const deprecatedPermissionsMap: Record<string, string[]> = {
    account: ['tokens', 'clients', 'users', 'tickets', 'managed'],
  };

  const combinedScopeMap = Object.entries(deprecatedPermissionsMap).reduce(
    (
      map: Record<string, number>,
      [parentPermissionName, deprecatedPermissions]
    ) => {
      const maxLevel = deprecatedPermissions.reduce(
        (level: number, deprecatedPermission: string) => {
          const deprecatedPermissionLevel = map[deprecatedPermission];

          return deprecatedPermissionLevel
            ? Math.max(level, deprecatedPermissionLevel)
            : level;
        },
        map[parentPermissionName]
      );

      return { ...map, [parentPermissionName]: maxLevel };
    },
    scopeMap
  );

  return basePerms.reduce(
    (tups: Permission[], permName: string): Permission[] => {
      const tup = [permName, combinedScopeMap[permName]] as Permission;
      return [...tups, tup];
    },
    []
  );
};

export const allMaxPerm = (
  scopeTups: Permission[],
  perms: typeof basePerms
): boolean => {
  if (scopeTups.length !== perms.length) {
    return false;
  }

  return scopeTups.reduce(
    (acc: boolean, [key, value]: Permission) =>
      value === levelMap.read_write && acc,
    true
  );
};

export const permTuplesToScopeString = (scopeTups: Permission[]): string => {
  if (allMaxPerm(scopeTups, basePerms)) {
    return '*';
  }
  const joinedTups = scopeTups.reduce((acc, [key, value]) => {
    const level = inverseLevelMap[value];
    if (level !== 'none') {
      return [...acc, [key, level].join(':')];
    }
    return [...acc];
  }, []);
  return joinedTups.join(' ');
};

/**
 * Determines whether permission scopes all have the same access level.
 *
 * If all scopes have the same access level, the numeric access level is
 * returned. Otherwise, `null` is returned.
 *
 * @param scopes - Permission scopes for which to check access levels.
 * @param excludedScopes - Permission scopes for which to exclude from the access level check. (e.g. they have a different default)
 * Example: { name: 'vpc', defaultAccessLevel: 0 } would ignore the VPC scope when it's set to None.
 *
 * @returns Access level for the given scopes if they are all the same; `null` otherwise.
 */
export const allScopesAreTheSame = (
  scopes: Permission[],
  excludedScopes?: ExcludedScope[]
) => {
  const sample = scopes[0];

  // Filter out any scopes that are set to their own defaults.
  const filteredScopes = scopes.filter(
    (scope: Permission) =>
      !excludedScopes?.find(
        (excludedScope) =>
          excludedScope.name === scope[0] &&
          excludedScope.defaultAccessLevel === scope[1]
      )
  );
  const scopeMatches = (scope: Permission) => scope[1] === sample[1];
  return filteredScopes.slice(1).every(scopeMatches) ? sample[1] : null;
};

/**
 * return true if the given time is past 100 year in the future
 */
export const isWayInTheFuture = (time: string) => {
  const wayInTheFuture = DateTime.local().plus({ years: 100 }).toISO();
  return isPast(wayInTheFuture)(time);
};

/**
 * Filters permissions from a base map, removing those specified in the perm parameter.
 *
 * @param basePermNameMap - Map of API permission keys to their corresponding Cloud names.
 * @param perm - Array of objects specifying permissions for inclusion or exclusion:
 *  - name: Key of the permission to filter.
 *  - shouldBeIncluded: Boolean indicating whether to include or exclude the permission.
 *
 * @returns A new map containing only the allowed permissions from basePermNameMap.
 */
export const filterPermsNameMap = <
  // We're constraining T to an array of objects with the following shape:
  T extends { name: keyof typeof basePermNameMap; shouldBeIncluded: boolean }[]
>(
  permMap: typeof basePermNameMap,
  perm: T
): // Return type excludes the keys specified by T in the perm parameter dynamically.
Omit<typeof basePermNameMap, T[number]['name']> => {
  const filteredPermNameMap = { ...permMap };

  for (const { name, shouldBeIncluded } of perm) {
    if (!shouldBeIncluded && filteredPermNameMap[name]) {
      delete filteredPermNameMap[name];
    }
  }

  return filteredPermNameMap;
};

/**
 * Determines whether a selection has been made for every scope, since by default, the scope permissions are set to null.
 *
 * @param scopeTuples - The array of scope tuples.
 * @returns {boolean} True if all scopes have permissions set to none/read_only/read_write, false otherwise.
 */
export const hasAccessBeenSelectedForAllScopes = (
  scopeTuples: Permission[]
): boolean => {
  const validAccessLevels = [
    levelMap['none'],
    levelMap['read_only'],
    levelMap['read_write'],
  ];
  return scopeTuples.every((scopeTuple) =>
    validAccessLevels.includes(scopeTuple[1])
  );
};
