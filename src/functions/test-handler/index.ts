export const testHandler = async (event: any) => {
    console.log("Test handler");
    return {
        statusCode: 200,
        body: JSON.stringify(event)
    }
}