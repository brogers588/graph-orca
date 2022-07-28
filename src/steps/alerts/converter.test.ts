import { OrcaAlert } from '../../types';
import { getAwsArnFromAlert } from './converter';

describe('#getAwsArnFromAlert', () => {
  test('should return `undefined` if no `asset_vendor_id` on alert', () => {
    expect(
      getAwsArnFromAlert(
        createMockAlert({
          asset_vendor_id: undefined,
        }),
      ),
    ).toEqual(undefined);
  });

  test('should return `undefined` if `asset_vendor_id` on alert is not of type `string`', () => {
    expect(
      getAwsArnFromAlert(
        createMockAlert({
          asset_vendor_id: 123 as unknown as string,
        }),
      ),
    ).toEqual(undefined);
  });

  test('should return AWS ARN if `asset_vendor_id` includes an ARN', () => {
    expect(getAwsArnFromAlert(createMockAlert())).toEqual(
      'arn:aws:iam::123456789123:role/MyRole',
    );
  });

  test('should return AWS ARN if `asset_vendor_id` includes an ARN with underscores', () => {
    expect(
      getAwsArnFromAlert(
        createMockAlert({
          asset_vendor_id:
            'ABCDEFGHIJKLMNOP_arn:aws:iam::123456789123:role/my_role',
        }),
      ),
    ).toEqual('arn:aws:iam::123456789123:role/my_role');
  });
});

function createMockAlert(partial?: Partial<OrcaAlert>): OrcaAlert {
  return {
    asset_vendor_id: 'ABCDEFGHIJKLMNOP_arn:aws:iam::123456789123:role/MyRole',
    ...partial,
  } as OrcaAlert;
}
