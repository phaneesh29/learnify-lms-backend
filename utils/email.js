import { Resend } from 'resend';
import { RESEND_API_KEY } from '../constants.js';

const resend = new Resend(RESEND_API_KEY);

export const sendEmail = async ({ to, subject, text }) => {
    const { data, error } = await resend.emails.send({
        from: 'Admin <no-reply@tsindia.org>',
        to: [to],
        subject: subject,
        html: `<p>${text}</p>`,
    });

    if (error) {
        return console.error({ error });
    }

    console.log({ data });
}