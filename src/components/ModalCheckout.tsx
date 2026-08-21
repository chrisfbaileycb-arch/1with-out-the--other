import React from "react";
import { PRICING_TIERS } from "../data/samples";
import confetti from "canvas-confetti";
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface ModalCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  onSelectTier: (tierId: string) => void;
}

export const ModalCheckout: React.FC<ModalCheckoutProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
}) => {
  if (!isOpen) return null;

  const handleUpgrade = (tierId: string) => {
    onSelectTier(tierId);
    if (tierId !== "free") {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Commercial License & Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Choose Your 1WithOut Tier
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Empower your team with verified claims audits, 5-10 directive autonomous agent skills, and continuous post-launch maintenance.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {PRICING_TIERS.map((tier) => {
            const isCurrent = currentTier === tier.id;
            return (
              <div
                key={tier.id}
                id={`modal-tier-${tier.id}`}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                    : tier.popular
                    ? "bg-slate-850 border-cyan-500/60 shadow-md"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {tier.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 inline-block mb-2">
                      {tier.badge}
                    </span>
                  )}

                  <h3 className="font-bold text-sm text-slate-100">{tier.name}</h3>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">
                      {tier.price}
                    </span>
                    <span className="text-[10px] text-slate-400">{tier.period}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    {tier.features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start gap-1.5 text-[11px] text-slate-300"
                      >
                        <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleUpgrade(tier.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-slate-700 text-slate-300 cursor-default"
                        : tier.popular
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {isCurrent ? "Active Plan" : tier.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Server-Side Token Generation • No Lock-in</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Instant Access to Full Multimodal Pipeline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
