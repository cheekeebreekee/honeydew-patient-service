const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')


const { NOTES_TABLE } = process.env

module.exports.handler = async (event) => {
    console.log("EVENT: ", event)
    
    const { text, type, patientId, creatorId, creatorRole } = event.arguments.newNote
    const noteId = ulid.ulid()

    const timestamp = new Date().toJSON()

    const newNote = {
        noteId,
        creatorId,
        creatorRole,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastModifiedBy: creatorId,
        text,
        type,
        patientId
    }

    await DocumentClient.put({
        TableName: NOTES_TABLE,
        Item: newNote
    }).promise()

    return newNote
}