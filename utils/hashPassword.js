import bcryptjs from "bcryptjs";

export const hashedPassword = async (password) => {
    const salt = await bcryptjs.genSalt(10);
    return await bcryptjs.hash(password, salt);
}

export const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs.compare(password, hashedPassword);
}