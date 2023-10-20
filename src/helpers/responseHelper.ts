export const responseHelper = (message: string, data?: any, error?: boolean, errorStatusCode?: number) => {
    const statusCode = error ? errorStatusCode : 200;

    return {
        statusCode,
        body: JSON.stringify({
            message,
            data
        })
    }
}