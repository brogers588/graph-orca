import {
  createIntegrationEntity,
  Entity,
} from '@jupiterone/integration-sdk-core';

import { Entities } from '../constants';

function createAccountId(email: string): string {
  return `orca-account-${email}`;
}

export function createAccountEntity(email: string): Entity {
  const accountId = createAccountId(email);

  return createIntegrationEntity({
    entityData: {
      source: {
        id: accountId,
        name: 'Orca Account',
      },
      assign: {
        _key: accountId,
        _type: Entities.ACCOUNT._type,
        _class: Entities.ACCOUNT._class,
        mfaEnabled: false,
        accessURL: 'https://app.orcasecurity.io',
      },
    },
  });
}
