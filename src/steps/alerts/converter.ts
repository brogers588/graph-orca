import { OrcaAlert } from '../../types';
import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  Relationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';
import { Entities } from '../constants';

export function createAlertFindingEntity(alert: OrcaAlert): Entity {
  return createIntegrationEntity({
    entityData: {
      source: alert,
      assign: {
        _type: Entities.ALERT._type,
        _class: Entities.ALERT._class,
        _key: `${alert.asset_unique_id}:${alert.state.alert_id}`,
        name: alert.type_string,
        displayName: alert.type_string,
        severity: alert.state.severity,
        numericSeverity: alert.state.score,
        open: alert.state.status === 'open',
        alertLabels: alert.alert_labels,
        category: alert.category,
        summary: alert.type_string,
        description: alert.details,
        details: alert.description,
        recommendation: alert.recommendation,
        typeKey: alert.type_key,
        ruleId: alert.rule_id,
        groupType: alert.group_type,
        groupName: alert.group_name,
        groupId: alert.group_unique_id,
        clusterType: alert.cluster_type,
        clusterName: alert.cluster_name,
        clusterId: alert.cluster_unique_id,
        subjectType: alert.subject_type,
        assetId: alert.asset_unique_id,
        assetCategory: alert.asset_category,
        assetType: alert.asset_type,
        assetName: alert.asset_name,
        accountName: alert.account_name,
        cloudVendorId: alert.cloud_vendor_id,
        cloudProvider: alert.cloud_provider,
        cloudProviderId: alert.cloud_provider_id,
        cloudAccountId: alert.cloud_account_id,
        assetLabels: alert.asset_labels,
        assetVendorId: alert.asset_vendor_id,
        assetDistributionName: alert.asset_distribution_name,
        assetDistributionVersion: alert.asset_distribution_version,
        assetDistributionMajorVersion: alert.asset_distribution_major_version,
        organizationId: alert.organization_id,
        organizationName: alert.organization_name,
        vmId: alert.vm_id,
        // This could be an AWS instance ID or an ARN
        uiUniqueField: alert.model?.data?.Inventory?.UiUniqueField,
        awsArn: getAwsArnFromAlert(alert),
      },
    },
  });
}

/**
 * Orca alerts vendor IDs can include ARN values. This function extracts the AWS
 * ARN from an Orca alert if it finds one, otherwise returns `undefined`
 */
export function getAwsArnFromAlert(alert: OrcaAlert): string | undefined {
  const { asset_vendor_id: assetVendorId } = alert;
  if (!assetVendorId || typeof assetVendorId !== 'string') return undefined;

  // Get first instance of `_`
  const assetVendorIdUnderscoreIndex = assetVendorId.indexOf('_');
  if (assetVendorIdUnderscoreIndex === -1) return undefined;

  const remainder = assetVendorId.substring(assetVendorIdUnderscoreIndex + 1);
  return remainder.startsWith('arn:') ? remainder : undefined;
}

export function createAccountAlertRelationship(
  account: Entity,
  alert: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: account,
    to: alert,
  });
}
