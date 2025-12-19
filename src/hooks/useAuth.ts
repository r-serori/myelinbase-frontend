"use client";
import { signOut } from "aws-amplify/auth";

export async function useSignOut() {
  await signOut();
  window.location.href = "/login";
}
