"use client";
import React from "react";
import { Amplify } from "@aws-amplify/core";

Amplify.configure(
  {
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID as string,
        userPoolClientId: process.env
          .NEXT_PUBLIC_COGNITO_APP_CLIENT_ID as string,
      },
    },
  },
  { ssr: true }
);

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
