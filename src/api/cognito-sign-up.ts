import { PreSignUpTriggerHandler } from 'aws-lambda';
import { logError, logInfo } from 'honeydew-shared';
import Joi from 'joi';

const validator = Joi.object({
  fullName: Joi.string().required(),
  dateOfBirth: Joi.string().required(),
  state: Joi.string().required(),
  parentInfo: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
  }).optional(),
  referralCode: Joi.string().optional(),
});

export const handler: PreSignUpTriggerHandler = async (
  event,
  context,
  callback,
) => {
  logInfo('Prettified body', event.request);

  if (!event.request.clientMetadata?.patientData) {
    throw new Error('No patient data provided');
  }

  const payload = JSON.parse(event.request.clientMetadata.patientData);

  const results = validator.validate(payload);
  if (results.error) {
    const errors = results.error.details.map(({ message }) => message);
    logError('ValidationError: cannot validate received schema', {
      errors,
    });
    callback(
      new Error('ValidationError: cannot validate received schema'),
      event,
    );
  }

  // eslint-disable-next-line no-param-reassign
  event.response.autoConfirmUser = true;
  // eslint-disable-next-line no-param-reassign
  event.response.autoVerifyEmail = true;

  callback(null, event);
};
