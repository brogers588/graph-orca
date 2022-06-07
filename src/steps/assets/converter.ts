import {
  createIntegrationEntity,
  createDirectRelationship,
  Entity,
  RelationshipClass,
  Relationship,
} from '@jupiterone/integration-sdk-core';

import { Entities } from '../constants';
import { OrcaAsset } from '../../types';

export function createAssetEntity(asset: OrcaAsset): Entity {
  return createIntegrationEntity({
    entityData: {
      source: asset,
      assign: {
        _type: Entities.ASSET._type,
        _class: Entities.ASSET._class,
        _key: asset.asset_unique_id,
        name: asset.asset_name,
        id: asset.asset_unique_id,
      },
    },
  });
}

export function createAccountAssetRelationship(
  account: Entity,
  asset: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: account,
    to: asset,
  });
}
