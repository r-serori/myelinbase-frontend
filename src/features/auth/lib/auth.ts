"use client";
import { fetchAuthSession } from "aws-amplify/auth";

export async function getJwt(): Promise<string> {
  const { tokens } = await fetchAuthSession();
  const token =
    process.env.NEXT_PUBLIC_LOGIN_SKIP === "true"
      ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNTZlMmI3MC0wOGU0LTQzMjEtYjU2YS04OWQ0MjNiY2Q1NjciLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzAwMDAwMDAwfQ.S0wP_KkLqc2uW4Q-7aKq8Q7Q8J3j5L2n4M6P9O_R1sQ"
      : tokens?.idToken?.toString();
  if (!token) throw new Error("No ID token");
  return token;
}
