export const responseHelper = (message: string, data?: any, errorStatusCode?: number) => {
    const statusCode = errorStatusCode ?? 200;

    return {
        statusCode,
        body: JSON.stringify({
            message,
            data
        })
    }
}