const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

const Chance = require('chance')
const chance = new Chance()


const { PATIENTS_TABLE, APPOINTMENTS_TABLE } = process.env

module.exports.handler = async (event) => {
    console.log("event: ", event)

    const { userName, request: { userAttributes } } = event
    const newUser = {
        userId: userName,
        email: userAttributes.email,
        createdAt: new Date().toISOString(),
        phone: chance.phone({ formatted: false }),
        referralId: chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' }),
        parentName: chance.name(),
        parentEmail: chance.email(),
        parentPhone: chance.phone({ formatted: false }),
        dateOfBirth: chance.birthday({ string: true, american: false }),
        height: chance.integer({ min: 100, max: 200 }), 
        weight: chance.integer({ min: 20, max: 100 }),
        zipCode: chance.zip(),
        isAccutane: chance.bool(),
        membership: 'free'
    }

    const newAppointment = {
        appointmentId: ulid(),
        userId: userName,
        createdAt: new Date().toISOString(),
        appointmentDate: chance.date({ year: 2023, month: 12, day: 31 }),
        appointmentTime: chance.hour({ twentyfour: true }),
        appointmentType: 'initial',
        appointmentStatus: 'pending',
        appointmentNotes: chance.sentence({ words: 10 }),
        appointmentLocation: 'online',
        appointmentProvider: 'Dr. John Doe',
    }

    await DocumentClient.put({
        TableName: PATIENTS_TABLE,
        Item: newUser
    }).promise()

    await DocumentClient.put({
        TableName: APPOINTMENTS_TABLE,
        Item: newAppointment
    }).promise()
    console.log ("User created: ", newUser)

    return event
}