# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 1.9.2 - 2022-08-09

### Changed

- Informational findings are no longer ingested.

## 1.9.1 - 2022-08-08

### Changed

- Increasing timeout for bulk download API calls.

## 1.9.0 - 2022-08-05

### Changed

- Findings are now ingested ungrouped using the bulk download method.

## 1.8.0 - 2022-07-28

### Added

- New properties added to resources:

  | Entity               | Properties    |
  | -------------------- | ------------- |
  | `orca_finding_alert` | `assetLabels` |

## 1.7.0 - 2022-07-28

### Added

- New properties added to resources:

  | Entity               | Properties      |
  | -------------------- | --------------- |
  | `orca_finding_alert` | `awsArn`        |
  | `orca_finding_alert` | `uiUniqueField` |

## 1.6.1 - 2022-07-27

### Changed

- Removed ingestion of information alerts
- Disable storing `orca_alert_finding` on file system. Orca alert findings can
  be super high volume. We don't iterate this data in later steps, so we can
  safely disable storing the data on the file system to save disk space.

## 1.6.0 - 2022-07-26

### Added

- New Finding entity added based on Orca Alerts:

| Resources | Entity `_type`       | Entity `_class` |
| --------- | -------------------- | --------------- |
| Alert     | `orca_finding_alert` | `Finding`       |

The Orca alert is categorized into the following:

- Authentication
- Best practices
- Data at risk
- Data protection
- IAM misconfigurations
- Lateral movement
- Logging and monitoring
- Malicious activity
- Neglected assets
- Network misconfigurations
- System integrity
- Vendor services misconfigurations
- Workload misconfigurations

| Source Entity `_type` | Relationship `_class` | Target Entity `_type` |
| --------------------- | --------------------- | --------------------- |
| `orca_account`        | **HAS**               | `orca_finding_alert`  |

## 1.5.0 - 2022-07-26

### Added

- New properties added to resources:

  | Entity         | Properties |
  | -------------- | ---------- |
  | `orca_finding` | `vmId`     |
  | `orca_asset`   | `vmId`     |

## 1.4.0 - 2022-07-25

### Added

- New properties added to resources:

  | Entity         | Properties      |
  | -------------- | --------------- |
  | `orca_finding` | `assetVendorId` |
  | `orca_asset`   | `assetVendorId` |

### Fixed

- Consider whether `asset_state` has value `"running"` when calculating
  `orca_asset` `enabled` property value

## 1.3.0 - 2022-07-21

### Added

- New properties added to resources:

  | Entity         | Properties              |
  | -------------- | ----------------------- |
  | `orca_finding` | `groupType`             |
  | `orca_finding` | `clusterType`           |
  | `orca_finding` | `type`                  |
  | `orca_finding` | `assetCategory`         |
  | `orca_finding` | `assetType`             |
  | `orca_finding` | `cloudVendorId`         |
  | `orca_finding` | `assetDistributionName` |
  | `orca_finding` | `cloudProvider`         |
  | `orca_asset`   | `enabled`               |
  | `orca_asset`   | `type`                  |
  | `orca_asset`   | `state`                 |
  | `orca_asset`   | `groupType`             |
  | `orca_asset`   | `clusterType`           |
  | `orca_asset`   | `category`              |
  | `orca_asset`   | `cloudVendorId`         |
  | `orca_asset`   | `cloudProvider`         |
  | `orca_asset`   | `cloudProviderId`       |
  | `orca_asset`   | `level`                 |
  | `orca_asset`   | `clusterUniqueId`       |
  | `orca_asset`   | `clusterName`           |
  | `orca_asset`   | `organizationId`        |
  | `orca_asset`   | `accountName`           |

### Fixed

- Handle potential duplicate `_key` error upon receiving a duplicate Orca
  finding from the API

## 1.2.6 - 2022-07-20

### Fixed

- Refresh auth token when invalid token error received

## 1.2.5 - 2022-07-20

### Fixed

- Stream asset API response as JSON into memory to handle large responses

## 1.2.4 - 2022-07-20

### Fixed

- Log warning with error details when failing to parse asset export file

## 1.2.3 - 2022-07-20

### Changed

- Improve error handling when downloading an asset export file

## 1.2.2 - 2022-07-19

### Fixed

- Switch asset collection to use the export API to bypass pagination limit of
  10,000 assets

## 1.2.1 - 2022-07-19

### Changed

- Improve request error logging

## 1.2.0 - 2022-06-17

### Changed

- Changed relationship

| Source         | class          | Target |
| -------------- | -------------- | ------ |
| `orca_finding` | ~~HAS~~ **IS** | `cve`  |

### Added

- Added support for pagination for /cves and /assets endpoints

## 1.1.1 - 2022-07-08

### Fixed

- Rename `assets` folder to `asset` to work around a bundling issue

## 1.1.0 - 2022-07-07

### Added

- Added support for ingesting the following **new** resources:

  | Resource | Type           | Class      |
  | -------- | -------------- | ---------- |
  | Asset    | `orca_asset`   | `Resource` |
  | Finding  | `orca_finding` | `Finding`  |

- Added support for ingesting the following **new** relationships:

  | Source         | class   | Target         |
  | -------------- | ------- | -------------- |
  | `orca_account` | **HAS** | `orca_asset`   |
  | `orca_account` | **HAS** | `orca_finding` |
  | `orca_asset`   | **HAS** | `orca_finding` |
  | `orca_finding` | **HAS** | `cve`          |
  | `orca_finding` | **IS**  | `cve`          |

## 1.0.0 - 2022-03-31

### Added

Initial Orca Integration.

- Ingest new entity `orca_account`
- Ingest new entity `orca_user`
- Ingest new entity `orca_group`

- Build new relationship `orca_account_has_user`
- Build new relationship `orca_account_has_group`
- Build new relationship `orca_group_has_user`
