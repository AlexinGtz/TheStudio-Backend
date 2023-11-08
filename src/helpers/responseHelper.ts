export const responseHelper = (message: string, data?: any, errorStatusCode?: number) => {
    const statusCode = errorStatusCode ?? 200;

    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
            statusCode,
            message,
            ...data
        })
    }
}