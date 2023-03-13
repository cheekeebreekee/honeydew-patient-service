const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

const { BUCKET_NAME, IMAGES_TABLE, REGION } = process.env

module.exports.handler = async (event) => {
    console.log("region: ", process.env)
    console.log('EVENT: ', event)
    console.log('BUCKET NAME: ', BUCKET_NAME)
    const params = {
        Bucket: BUCKET_NAME,
        Key: event.detail.object.key
    }
    const metaData = await s3.headObject(params).promise();
    console.log('METADATA: ', metaData.Metadata)
    const remappedData = await remapMetaData(metaData.Metadata)
    console.log('REMAPPED METADATA: ', remappedData)

    const newImage = {
        imageId: event.detail.object.key,
        createdAt: new Date().toISOString(),
        ...remappedData,
        path: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${event.detail.object.key}`
    }
    await DocumentClient.put({
        TableName: IMAGES_TABLE,
        Item: newImage
    }).promise()
}


async function remapMetaData (metaData) {
    metaData.patientId = metaData.patientid
    metaData.fileName = metaData.filename
    delete metaData.patientid
    delete metaData.filename
    return metaData
}