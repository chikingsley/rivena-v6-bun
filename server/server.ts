import { Elysia, Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from '@elysiajs/swagger'

import { auth } from "../src/lib/auth";

// user middleware (compute user and session and pass to routes)
const betterAuth = new Elysia({ name: "better-auth" })
    .use(
        cors({
            origin: ["http://localhost:3001", "http://localhost:3000"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ error, request: { headers } }) {
                try {
                    const session = await auth.api.getSession({
                        headers,
                    });

                    if (!session) return error(401);

                    return {
                        user: session.user,
                        session: session.session,
                    };
                } catch (e) {
                    console.error('Auth error:', e);
                    return error(401);
                }
            },
        },
    });

const app = new Elysia()
    .use(betterAuth)
    // Test endpoint to check if sessions are working
    .get("/api/test/session", async ({ request }) => {
        try {
            const session = await auth.api.getSession({
                headers: request.headers,
            });
            return {
                hasSession: !!session,
                sessionData: session,
                cookies: request.headers.get('cookie'),
            };
        } catch (error) {
            console.error('Session test error:', error);
            return {
                error: 'Failed to get session',
                errorDetails: error,
                cookies: request.headers.get('cookie'),
            };
        }
    })
    // Protected user endpoint
    .get("/api/user", ({ user }) => user, {
        auth: true,
    })
    // Add swagger for API documentation
    .use(swagger())
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

console.log('Auth routes available at /api/auth/*');
console.log('Test session endpoint at /api/test/session');
console.log('User endpoint at /api/user');
console.log('Swagger docs at /swagger');