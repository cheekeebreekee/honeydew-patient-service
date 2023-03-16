import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { config, EventMappers, logInfo, publishEvent } from 'honeydew-shared';
import { DynamoDBService } from 'shared/dynamodb';
import { v4 as uuidV4 } from 'uuid';

type NewPatientPayload = {
  fullName: string;
  dateOfBirth: string;
  state: string;
  parentInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  referralCode?: string;
};

export const handler: PostConfirmationTriggerHandler = async (
  event,
  context,
  callback,
) => {
  if (!event.request.clientMetadata?.patientData) {
    throw new Error('Something went wrong. Cannot find patient data');
  }
  await config.initConfig();

  const payload: NewPatientPayload = JSON.parse(
    event.request.clientMetadata?.patientData,
  );
  logInfo('Prettified body', payload);

  logInfo("Adding new patient's account into patients group");
  const client = new CognitoIdentityProviderClient({});
  await client.send(
    new AdminAddUserToGroupCommand({
      GroupName: 'patients',
      Username: event.userName,
      UserPoolId: config.getSecretValue('cognitoUserPoolId'),
    }),
  );

  const { fullName, dateOfBirth, state, parentInfo } = payload;
  const patientId = uuidV4();
  const email = event.userName;

  await DynamoDBService.patients.createPatient({
    patientId,
    accountId: event.request.userAttributes.sub,
    fullName,
    dateOfBirth,
    state,
    parentInfo,
    email,
  });

  logInfo('Sending an event to create referral user');
  const createReferralPayload = payload.referralCode
    ? EventMappers.referral.createReferralUserByCodeEvent(payload.referralCode)
    : EventMappers.referral.createReferralUserEvent(
        payload.fullName,
        event.userName,
      );
  await publishEvent(
    JSON.stringify(createReferralPayload.payload),
    createReferralPayload.eventType,
  );
  logInfo('Sending an event to create Stripe customer');
  const createStripeCustomerPayload =
    EventMappers.payment.createStripeCustomerEvent(
      patientId,
      email,
      payload.fullName,
    );
  await publishEvent(
    JSON.stringify(createStripeCustomerPayload.payload),
    createStripeCustomerPayload.eventType,
  );
  logInfo('Sending marketing tag event about created account');
  const setMarketingTagPayload =
    EventMappers.marketing.marketingSetStatusTagEvent({
      patientId,
      tag: 'Account Created',
      add: true,
    });
  await publishEvent(
    JSON.stringify(setMarketingTagPayload.payload),
    setMarketingTagPayload.eventType,
  );
  callback(null, event);
};
