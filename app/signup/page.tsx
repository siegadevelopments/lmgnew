'use client'

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useBotProtection } from "@/hooks/use-bot-protection";
import { HoneypotField } from "@/components/HoneypotField";
import { User, Store } from "lucide-react";
import { cn } from "@/lib/utils";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect");
  const urlType = searchParams?.get("type");

  const initialAccountType =
    urlType === "vendor" || redirectTo?.includes("vendor")
      ? "vendor"
      : "customer";

  const [accountType, setAccountType] = useState<"customer" | "vendor">(initialAccountType);

  const { signUp } = useAuth();
  const { honeypot, setHoneypot, onInteraction, validateSubmission } = useBotProtection();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isVendor = accountType === "vendor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateSubmission()) {
      setError("An error occurred. Please try again in a few seconds.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const targetRedirect = redirectTo
      ? redirectTo
      : isVendor
      ? "/vendor"
      : "/";

    const redirectUrl = window.location.origin + targetRedirect;

    const { error: authError } = await signUp(
      email,
      password,
      {
        full_name: name,
        requested_role: isVendor ? "vendor" : "customer",
      },
      redirectUrl,
    );

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        {!success ? (
          <div key="signup-form">
            <CardHeader className="text-center pb-4">
              {/* Account Type Selector Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setAccountType("customer")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200",
                    !isVendor
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <User className="h-4 w-4" />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("vendor")}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200",
                    isVendor
                      ? "bg-wellness text-wellness-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Store className="h-4 w-4" />
                  Vendor / Partner
                </button>
              </div>

              <CardTitle className="text-2xl font-bold">
                {isVendor ? "Create a Vendor Account" : "Create a Customer Account"}
              </CardTitle>
              <CardDescription className="mt-1">
                {isVendor
                  ? "Join Lifestyle Medicine Gateway to showcase & sell your products"
                  : "Join Lifestyle Medicine Gateway to explore & purchase natural remedies"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} onFocus={onInteraction} onClick={onInteraction} onKeyDown={onInteraction}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                
                {/* Bot protection field */}
                <HoneypotField value={honeypot} onChange={setHoneypot} />

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className={cn(
                    "w-full font-bold h-11 text-sm shadow-md transition-all duration-200",
                    isVendor
                      ? "bg-wellness text-wellness-foreground hover:bg-wellness/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {isVendor ? "Creating Vendor Account..." : "Creating Customer Account..."}
                    </span>
                  ) : isVendor ? (
                    "Create a Vendor Account"
                  ) : (
                    "Create a Customer Account"
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href={{ pathname: "/login", query: redirectTo ? { redirect: redirectTo } : {} }}
                    className={cn(
                      "font-semibold hover:underline",
                      isVendor ? "text-wellness" : "text-primary"
                    )}
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </div>
        ) : (
          <div key="success-state">
            <CardContent className="pt-6 text-center">
              <div
                className={cn(
                  "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
                  isVendor ? "bg-wellness/15 text-wellness" : "bg-primary/10 text-primary"
                )}
              >
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>. Click the link to verify
                your {isVendor ? "vendor" : "customer"} account and get started.
              </p>
              <Button
                className="mt-6"
                variant={isVendor ? "wellness" : "default"}
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
