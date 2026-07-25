import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { onboardingSlides } from "./onboarding-data";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = onboardingSlides[step];
  const isLast = step === onboardingSlides.length - 1;
  const Icon = slide.icon;

  const next = () =>
    isLast ? navigate("/home", { replace: true }) : setStep((s) => s + 1);

  return (
    <AppShell>
      <div className="flex justify-end px-5 pt-5">
        <button
          type="button"
          onClick={() => navigate("/home", { replace: true })}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip
        </button>
      </div>

      <div className="flex h-[calc(100%-3rem)] flex-col px-6 pb-10">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div key={step} className="animate-scale-in">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-primary shadow-soft">
              <Icon className="h-14 w-14 text-primary-foreground" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-foreground">{slide.title}</h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {slide.description}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pb-8">
          {onboardingSlides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        <Button variant="gradient" size="lg" className="w-full" onClick={next}>
          {isLast ? "Get started" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </AppShell>
  );
};

export default Onboarding;
