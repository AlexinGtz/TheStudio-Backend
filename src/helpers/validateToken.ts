import * as jwt from 'jsonwebtoken';

export const validateToken = async (token: string) => {
    if(!token) {
        return null;
    }

    const splittedToken = token.split(' ')[1];
    let decodedToken;

    try {
        decodedToken = await jwt.verify(splittedToken, process.env.JWT_SECRET!) as any;
    } catch (e) {
        console.log('error', e);
    }
    if (!decodedToken) {
        return null;
    }

    return {
        id: decodedToken.id,
        userType: decodedToken.userType,
        firstName: decodedToken.firstName,
        lastName: decodedToken.lastName
    }
}