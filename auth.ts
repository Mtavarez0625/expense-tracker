import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./src/lib/prisma";

export const authOptions: NextAuthOptions = {
    pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
     async authorize(credentials) {
  console.log("LOGIN ATTEMPT:", credentials);

  if (!credentials?.email || !credentials?.password) {
    console.log("Missing email or password");
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string },
  });

  console.log("USER FOUND:", user);

  if (!user) {
    console.log("No user found for this email");
    return null;
  }

  const valid = await bcrypt.compare(
    credentials.password as string,
    user.password
  );

  console.log("PASSWORD VALID:", valid);

  if (!valid) {
    console.log("Password did not match");
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
} 
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;  
    },
  },
};