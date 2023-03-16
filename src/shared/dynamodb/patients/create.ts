import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { logInfo } from 'honeydew-shared';

const dynamoDb = new DynamoDB({});

interface CreatePatientInDBPayload {
  patientId: string;
  accountId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  state: string;
  parentInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export const createPatient = async (
  createPatientPayload: CreatePatientInDBPayload,
) => {
  logInfo('Creating new patient in database', createPatientPayload);
  const query = {
    TableName: process.env.PATIENTS_TABLE,
    Item: marshall(createPatientPayload),
  };

  await dynamoDb.putItem(query);
};
