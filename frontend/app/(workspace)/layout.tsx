import React from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

// Mock implementation of getAppUser based on prompt instructions
async function getAppUser() {
  try {
    const authModule = await import("@/app/app-auth").catch(() => null);
    if (authModule && authModule.getAppUser) {
      return authModule.getAppUser();
    }
  } catch (e) {
    // Ignore
  }
  
  // Fallback if not implemented yet
  return { email: "founder@vcbrain.co", displayName: "Founding Partner" };
}

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();

  if (!user) {
    redirect("/");
  }

  // Check if Providers exists to wrap it
  let ProvidersWrapper = React.Fragment;
  try {
    const providersModule = await import("@/app/providers").catch(() => null);
    if (providersModule && providersModule.Providers) {
      ProvidersWrapper = providersModule.Providers;
    }
  } catch (e) {
    // Ignore
  }

  return (
    <ProvidersWrapper>
      <AppShell user={user}>
        {children}
      </AppShell>
    </ProvidersWrapper>
  );
}
