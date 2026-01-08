import { User, Session } from "lucia";
import { PinoLogger } from "hono-pino";

export interface AppBindings {
    Variables: {
        user: User | null;
        session: Session | null;
        logger: PinoLogger;
    }
}
