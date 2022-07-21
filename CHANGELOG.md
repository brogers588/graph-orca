# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
