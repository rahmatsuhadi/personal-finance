import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { GoogleLoginButton } from "@/components/molecules";
import { OnboardingHeader, OnboardingForm } from "@/components/organisms";

export function OnboardingScreen() {
  const form = useOnboardingForm();

  return (
    <div className="flex h-dvh flex-col bg-brutal-bg overflow-y-auto">
      {/* Hero Block */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Brand Logo & Feature Pills */}
        <OnboardingHeader />

        {/* Divider */}
        <div className="w-full border-t-4 border-brutal-black mb-8" />

        {/* Google Authentication */}
        <GoogleLoginButton
          isGoogleLoading={form.isGoogleLoading}
          onClick={form.handleGoogleLogin}
        />

        {/* OR separator */}
        <div className="w-full max-w-sm flex items-center gap-3 mb-4">
          <div className="flex-1 border-t-2 border-brutal-black/30" />
          <span className="text-xs font-bold uppercase text-brutal-black/50 tracking-widest">
            atau
          </span>
          <div className="flex-1 border-t-2 border-brutal-black/30" />
        </div>

        {/* Local Setup Form */}
        <OnboardingForm
          name={form.name}
          onChangeName={(val) => {
            form.setName(val);
            if (form.error) form.setError("");
          }}
          onKeyDown={form.handleKeyDown}
          onSubmit={form.handleSave}
          isLoading={form.isLoading}
          error={form.error}
        />
      </div>

      {/* Bottom decoration stripe */}
      <div className="flex h-3 border-t-2 border-brutal-black">
        <div className="flex-1 bg-brutal-lime" />
        <div className="flex-1 bg-brutal-cyan" />
        <div className="flex-1 bg-brutal-yellow" />
        <div className="flex-1 bg-brutal-pink" />
        <div className="flex-1 bg-brutal-purple" />
      </div>
    </div>
  );
}
