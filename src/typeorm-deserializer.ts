import { DataSource, EntityManager } from 'typeorm';
import { DriverUtils } from 'typeorm/driver/DriverUtils';

export type RelationMapping<Property> =
  Property extends Promise<infer I> ? RelationMapping<NonNullable<I>> :
  Property extends Array<infer I> ? RelationMapping<NonNullable<I>> :
  Property extends object ? RelationMappingObject<Property> :
  never;

export type RelationMappingObject<Entity> = {
  alias: string;
  relations?: RelationMappingRelations<Entity>;
}

export type RelationMappingRelations<Entity> = {
  [P in keyof Entity]?: RelationMapping<NonNullable<Entity[P]>> | string;
};

function processRow<T>(dataSource: DataSource, row: any, entityType: { new(): T }, mapping: RelationMappingObject<any> | string, entityCache: Map<string, Map<string, any>>): [T, boolean] {
  const driver = dataSource.driver;
  const metadata = dataSource.getMetadata(entityType);
  const aliasName = (typeof mapping === 'string') ? mapping : mapping.alias;
  const primaryColumns = metadata.primaryColumns.map(c => c.databaseName);
  const primaryColumnAliases = primaryColumns.map(c => DriverUtils.buildAlias(driver, undefined, aliasName, c));
  const primaryKeyValues = primaryColumnAliases.map(prop => row[prop]);
  if (primaryKeyValues.every(v => v == null))
    return [null, false];
  if (!entityCache.has(aliasName)) {
    entityCache.set(aliasName, new Map())
  }
  const mergedKeyValue = primaryKeyValues.join('_');
  let entity = entityCache.get(aliasName).get(mergedKeyValue);
  const newEntity = (entity == null);
  if (newEntity) {
    entity = deserializeEntity(dataSource, entityType, row, aliasName);
    entityCache.get(aliasName).set(mergedKeyValue, entity);
  }
  if (typeof mapping !== 'string') {
    const relations = mapping.relations;
    const entries = Object.entries(relations) as [string, RelationMappingObject<any> | string][];
    for (const [prop, childMapping] of entries) {
      const relation = metadata.relations.find(r => r.propertyName === prop);
      if (relation == null)
        throw new Error(`relation '${prop}' not found`);
      const [child, isNew] = processRow(dataSource, row, relation.type as any, childMapping, entityCache);
      if (relation.isOneToOne || relation.isManyToOne) {
        entity[prop] = child;
      } else {
        if (entity[prop] == null) {
          entity[prop] = [];
        }
        if (isNew || !(entity[prop] as any[]).includes(child)) {
          entity[prop].push(child);
        }
      }
    }
  }
  return [entity, newEntity];
}

export function deserializeEntity<T>(_dataSource: DataSource | EntityManager, entityType: { new(): T }, rawData: any, customTableAlias?: string) {
  const dataSource = (_dataSource instanceof DataSource) ? _dataSource : _dataSource.connection;
  const driver = dataSource.driver;
  const metadata = dataSource.getMetadata(entityType);
  const entity = new entityType();
  const columns = metadata.columns;
  for (const column of columns) {
    if (column.isVirtual)
      continue;
    const tableAlias = customTableAlias ?? metadata.tableName;
    const propName = DriverUtils.buildAlias(driver, undefined, tableAlias, column.databaseName);
    const value = rawData[propName];
    if (value === undefined)
      continue;
    const convertedValue = driver.prepareHydratedValue(value, column);
    column.setEntityValue(entity, convertedValue);
  }
  return entity as T;
}

export function deserializeEntities<T>(_dataSource: DataSource | EntityManager, entityType: { new(): T }, rawData: any[], mappings?: RelationMappingObject<T>) {
  const dataSource = (_dataSource instanceof DataSource) ? _dataSource : _dataSource.connection;
  const metadata = dataSource.getMetadata(entityType);
  const mainAlias = (mappings != null) ? (typeof mappings === 'string') ? mappings : mappings.alias : metadata.tableName;
  const entityCache = new Map<string, Map<string, any>>();
  const result: T[] = [];
  for (const row of rawData) {
    const [entity, isNew] = processRow(dataSource, row, entityType, mappings ?? mainAlias, entityCache);
    if (isNew) {
      result.push(entity);
    }
  }
  for (const map of entityCache.values()) {
    for (const entity of map.values()) {
      const metadata = dataSource.getMetadata(entity.constructor);
      for (const listener of metadata.afterLoadListeners) {
        const targetFunc = listener.propertyName;
        entity[targetFunc]();
      }
    }
  }
  return result;
}
