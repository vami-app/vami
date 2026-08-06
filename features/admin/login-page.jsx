'use client';

import { useState } from "react";
import toast from "react-hot-toast";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { AuthLayoutTemplate } from "@/components/templates/auth-layout";
import { FormField } from "@/components/molecules/form-field";
import { PasswordInput } from "@/components/molecules/password-input";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { Icon } from "@/components/atoms/icon";
import { Text } from "@/components/atoms/text";

export function LoginPageFeature() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success("Logged in successfully");
        window.location.href = "/admin";
        return;
      } else {
        const data = await res.json();
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during authentication");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthLayoutTemplate
        title={
          <>
            Smalloys <Text as="span" variant="body" className="text-text-muted text-3xl font-light">Admin</Text>
          </>
        }
        subtitle="Sign in to manage catalog, categories, and content"
      >
        <form className="space-y-6" onSubmit={handleLogin}>
          <FormField label="Email Address">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Icon icon={Mail} size="sm" />
              </div>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@smalloys.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField label="Password">
            <PasswordInput
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={<Icon icon={Lock} size="sm" />}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  Sign In
                  <Icon icon={ArrowRight} size="sm" className="ml-2 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </AuthLayoutTemplate>

      <Text variant="caption" className="text-center absolute bottom-8 w-full">
        Protected Portal &bull; Smalloys Metallurgical Foundry
      </Text>
    </div>
  );
}
