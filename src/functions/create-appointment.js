const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')


const { APPOINTMENTS_TABLE, NOTES_TABLE } = process.env

module.exports.handler = async (event) => {
    console.log("EVENT: ", event)
    console.log("USERNAME: ", event.identity.username)
    
    const { patientId, startTime, service, provider, note, endTime, status } = event.arguments.newAppointment
    const appointmentId = ulid.ulid()

    const timestamp = new Date().toJSON()

    const newAppointment = {
        appointmentId,
        patientId: patientId ? patientId : event.identity.username,
        createdAt: timestamp,
        updatedAt: timestamp,
        startTime,
        endTime,
        service,
        providerId: provider,
        note,
        status
    }
    console.log("NewAppointment: ", newAppointment)

    await DocumentClient.put({
        TableName: APPOINTMENTS_TABLE,
        Item: newAppointment
    }).promise()

    if (note) {
        await DocumentClient.put({
            TableName: NOTES_TABLE,
            Item: {
                noteId: ulid.ulid(),
                appointmentId,
                patientId: patientId ? patientId : event.identity.username,
                providerId: provider,
                note,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }).promise()
    }


    return newAppointment
}