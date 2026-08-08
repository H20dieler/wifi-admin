"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// login() only ever redirects or throws -- it doesn't return ActionState
// the way every other form action in this app does, so useActionState
// doesn't apply here. useFormStatus is the right primitive for "is the
// form I'm inside of currently submitting", independent of what the
// action returns.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Signing in…
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  );
}

export function LoginForm({ error }: { error?: string }) {
  return (
    <form action={login} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error === "invalid-credentials"
            ? "Incorrect email or password."
            : error === "connection-issue"
              ? "Couldn't reach the server. Check your connection and try again."
              : "Enter both an email and a password."}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
