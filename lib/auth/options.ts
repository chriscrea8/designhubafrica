import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  // IMPORTANT: Don't use PrismaAdapter with credentials provider + JWT
  // It causes issues with session handling. Handle user creation manually in callbacks.
  session: { strategy: "jwt", maxAge: 60 * 60 }, // 1 hour max, client enforces 10min inactivity
  pages: { signIn: "/login", signOut: "/", error: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Your account has been suspended");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.image,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth — create user if doesn't exist
      if (account?.provider === "google" && user.email) {
        const existing = await db.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          const names = (user.name || "User").split(" ");
          await db.user.create({
            data: {
              firstName: names[0] || "User",
              lastName: names.slice(1).join(" ") || "",
              email: user.email,
              image: user.image,
              emailVerified: new Date(),
              role: "CLIENT",
              isVerified: true,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }
      
      // For Google OAuth, fetch user data from DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await db.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "CLIENT";
        session.user.firstName = (token.firstName as string) || "";
        session.user.lastName = (token.lastName as string) || "";
      }
      return session;
    },
  },
};
