import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../constants.js"

export const generateToken = ({id,email,role}) => {
    return jwt.sign({ id,email,role }, JWT_SECRET,{expiresIn: '1d' })
}
