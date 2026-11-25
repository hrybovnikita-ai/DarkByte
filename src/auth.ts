import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getPrisma } from "@/lib/db";
import {
  isDatabaseAuthReady,
  isGoogleOAuthConfigured,
} from "@/server/auth/config";
import { verifyPassword } from "@/server/auth/password";
import { credentialsSchema } from "@/server/validators/auth";
import { authConfig } from "@/auth.config";

class EmailNotVerified extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

const prisma = getPrisma();

const providers = [];

if (prisma && isDatabaseAuthReady()) {
  providers.push(
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) {
          return null;
        }

        const passwordValid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );
        if (!passwordValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new EmailNotVerified();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  );
}

if (isGoogleOAuthConfigured()) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!prisma) {
        return false;
      }

      if (account?.provider === "google") {
        const bootstrapEmail = process.env.DARKBYTE_BOOTSTRAP_ADMIN_EMAIL;
        const email =
          user.email ??
          (typeof profile === "object" &&
          profile &&
          "email" in profile &&
          typeof profile.email === "string"
            ? profile.email
            : null);

        if (user.id && email) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
              ...(bootstrapEmail &&
              email.toLowerCase() === bootstrapEmail.toLowerCase()
                ? { role: "ADMIN" as Role }
                : {}),
              ...(typeof profile === "object" &&
              profile &&
              "name" in profile &&
              typeof profile.name === "string"
                ? { name: profile.name }
                : {}),
              ...(typeof profile === "object" &&
              profile &&
              "picture" in profile &&
              typeof profile.picture === "string"
                ? { image: profile.picture }
                : {}),
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.role = user.role ?? "USER";
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      } else if (token.id && prisma) {
        const row = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, email: true, name: true, image: true },
        });
        if (row) {
          token.role = row.role;
          token.email = row.email;
          token.name = row.name;
          token.picture = row.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = (token.role as Role) ?? "USER";
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image =
          typeof token.picture === "string" ? token.picture : session.user.image;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!prisma || !user.id) {
        return;
      }
      const bootstrapEmail = process.env.DARKBYTE_BOOTSTRAP_ADMIN_EMAIL;
      if (
        bootstrapEmail &&
        user.email?.toLowerCase() === bootstrapEmail.toLowerCase()
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
});

export function isAuthProvidersConfigured(): boolean {
  return providers.length > 0;
}