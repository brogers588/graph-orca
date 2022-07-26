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
      source: {},
      assign: {
        _type: Entities.ASSET._type,
        _class: Entities.ASSET._class,
        _key: asset.asset_unique_id,
        name: asset.asset_name,
        id: asset.asset_unique_id,
        enabled:
          asset.asset_state === 'enabled' || asset.asset_state === 'running',
        state: asset.asset_state,
        type: asset.asset_type,
        groupType: asset.group_type,
        clusterType: asset.cluster_type,
        category: asset.asset_category,
        cloudVendorId: asset.cloud_vendor_id,
        cloudProvider: asset.cloud_provider,
        cloudProviderId: asset.cloud_provider_id,
        level: asset.level,
        clusterUniqueId: asset.cluster_unique_id,
        clusterName: asset.cluster_name,
        organizationId: asset.organization_id,
        accountName: asset.account_name,
        assetVendorId: asset.asset_vendor_id,
        vmId: asset.vm_id,
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
