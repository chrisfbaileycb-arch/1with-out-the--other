import React, { useState, useEffect } from "react";
import {
  TabType,
  AppRegistryItem,
  SecurityClearance,
  ProductItem,
  StoreOrder,
  CartLineItem,
  ProductVariant,
  ProductModifierOption,
} from "./types";
import { INITIAL_REGISTRY_APPS, SAMPLE_SCENARIOS } from "./data/samples";
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from "./data/opcSamples";
import { Navbar } from "./components/Navbar";
import { CoverPageView } from "./components/CoverPageView";
import { OpcLaunchpadView } from "./components/OpcLaunchpadView";
import { StorefrontView } from "./components/StorefrontView";
import { BackofficeView } from "./components/BackofficeView";
import { NovaAgentWorkspaceView } from "./components/NovaAgentWorkspaceView";
import { OverviewView } from "./components/OverviewView";
import { DiscernView } from "./components/DiscernView";
import { SkillBuilderView } from "./components/SkillBuilderView";
import { PreFlightAuditView } from "./components/PreFlightAuditView";
import { RegistryView } from "./components/RegistryView";
import { DefenseGateView } from "./components/DefenseGateView";
import { ModalCheckout } from "./components/ModalCheckout";

export function App() {
  // Default to the new welcoming Cover Page
  const [activeTab, setActiveTab] = useState<TabType>("cover");
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Security Clearance for Defense-of-Break Gate (Passcode access)
  const [securityClearance, setSecurityClearance] = useState<SecurityClearance | null>(null);

  // E-Commerce Store & Catalog State
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem("opc_store_products");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<StoreOrder[]>(() => {
    const saved = localStorage.getItem("opc_store_orders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ORDERS;
  });

  const [cart, setCart] = useState<CartLineItem[]>(() => {
    const saved = localStorage.getItem("opc_store_cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("opc_store_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("opc_store_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("opc_store_cart", JSON.stringify(cart));
  }, [cart]);

  // Nova Agent prompt handoff
  const [agentInitialPrompt, setAgentInitialPrompt] = useState<string>("");

  // Cross-component state transfers
  const [discernInitialContent, setDiscernInitialContent] = useState<string>("");
  const [discernInitialSourceType, setDiscernInitialSourceType] = useState<any>("text");
  const [discernInitialSourceUrl, setDiscernInitialSourceUrl] = useState<string>("");

  const [skillInitialContent, setSkillInitialContent] = useState<string>("");
  const [skillInitialName, setSkillInitialName] = useState<string>("");

  // Pre-Flight Audit initial state for cross-component triggers
  const [auditInitialAppName, setAuditInitialAppName] = useState<string>("1WithOut Master PWA Engine");
  const [auditInitialLiveUrl, setAuditInitialLiveUrl] = useState<string>("https://1without.io");
  const [auditInitialRepoUrl, setAuditInitialRepoUrl] = useState<string>("https://github.com/1without/master-engine");
  const [auditInitialStackDesc, setAuditInitialStackDesc] = useState<string>(
    "Next.js App Router, React 18, Tailwind CSS, Express TypeScript server, Port 3000 Ingress, Gemini 3.7 Flash server-side integration, Stripe Checkout, and Defense-of-Break sentinel."
  );

  // App Lifecycle Registry state
  const [registryApps, setRegistryApps] = useState<AppRegistryItem[]>(() => {
    const saved = localStorage.getItem("1without_apps_registry");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_REGISTRY_APPS;
  });

  useEffect(() => {
    localStorage.setItem("1without_apps_registry", JSON.stringify(registryApps));
  }, [registryApps]);

  // Cart operations
  const handleAddToCart = (
    product: ProductItem,
    variant?: ProductVariant,
    modifiers?: Record<string, ProductModifierOption>
  ) => {
    const unitPrice =
      (variant ? variant.price : product.price) +
      (modifiers ? Object.values(modifiers).reduce((s, m) => s + m.priceDelta, 0) : 0);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedVariant?.id === variant?.id
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          selectedVariant: variant,
          selectedModifiers: modifiers,
          unitPrice,
        },
      ];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartLineItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const newOrder: StoreOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `OPC-${Math.floor(10000 + Math.random() * 90000)}`,
      customerEmail: "user.checkout@1without.io",
      items: [...cart],
      subtotal,
      tax,
      total,
      paymentStatus: "PAID",
      fulfillmentStatus: "PROCESSING",
      createdAt: new Date().toISOString(),
      paymentRail: "Shopify Checkout",
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
  };

  // Back-office Product & Order CRUD
  const handleAddProduct = (newProd: ProductItem) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateProduct = (updated: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (prodId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
  };

  const handleUpdateOrderStatus = (orderId: string, status: "PAID" | "PENDING" | "REFUNDED" | "FAILED") => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o)));
  };

  const handleUpdateFulfillment = (
    orderId: string,
    status: "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED"
  ) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: status } : o)));
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_SCENARIOS.find((s) => s.id === sampleId);
    if (!sample) return;

    if (sample.suggestedMode === "build_skill") {
      setSkillInitialContent(sample.fullContent);
      setSkillInitialName(sample.title);
      setActiveTab("skills");
    } else {
      setDiscernInitialContent(sample.fullContent);
      setDiscernInitialSourceType(sample.sourceType);
      setDiscernInitialSourceUrl(sample.sourceUrl || "");
      setActiveTab("discern");
    }
  };

  const handleSendToSkillBuilder = (text: string, title: string) => {
    setSkillInitialContent(text);
    setSkillInitialName(`Executable Skill: ${title.replace(/^Audit:\s*|^Remediation Directives:\s*/i, "")}`);
    setActiveTab("skills");
  };

  const handleAddApp = (app: AppRegistryItem) => {
    setRegistryApps((prev) => [app, ...prev]);
  };

  const handleRemoveApp = (appId: string) => {
    setRegistryApps((prev) => prev.filter((a) => a.id !== appId));
  };

  const handleSelectAppForAudit = (app: AppRegistryItem) => {
    setAuditInitialAppName(app.name);
    if (app.liveUrl) setAuditInitialLiveUrl(app.liveUrl);
    if (app.repoUrl) setAuditInitialRepoUrl(app.repoUrl);
    if (app.description) setAuditInitialStackDesc(app.description);
    setActiveTab("audit");
  };

  // Determine whether current view should use technical dark mode or soft-white executive palette
  const isTechnicalDarkMode = activeTab === "agent_workspace" || activeTab === "defense";

  return (
    <div
      id="1without-root-app"
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isTechnicalDarkMode
          ? "bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950"
          : "bg-[#FAF9F6] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900"
      }`}
    >
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpgradeModal={() => setIsCheckoutOpen(true)}
        currentTier={currentTier}
        securityClearance={securityClearance}
        onOpenDefenseGate={() => setActiveTab("defense")}
      />

      {/* Main Content View Switcher */}
      <main id="main-content-view" className="flex-1">
        {/* VIEW 0: WELCOMING SOFT-WHITE COVER PAGE (Landing at /) */}
        {activeTab === "cover" && (
          <CoverPageView
            onEnterStudio={() => setActiveTab("launchpad")}
            onViewStorefront={() => setActiveTab("storefront")}
            onOpenCopilot={(prompt) => {
              if (prompt) setAgentInitialPrompt(prompt);
              setActiveTab("agent_workspace");
            }}
            onViewCertification={() => setActiveTab("audit")}
          />
        )}

        {/* VIEW 1: OPC LAUNCHPAD & DOMAIN STUDIO (at /launchpad) */}
        {activeTab === "launchpad" && (
          <OpcLaunchpadView
            onNavigateToStorefront={() => setActiveTab("storefront")}
            onNavigateToAgentWorkspace={(prompt) => {
              if (prompt) setAgentInitialPrompt(prompt);
              setActiveTab("agent_workspace");
            }}
            onNavigateToCertification={() => setActiveTab("audit")}
          />
        )}

        {/* VIEW 2: PUBLIC STOREFRONT & CATALOG */}
        {activeTab === "storefront" && (
          <StorefrontView
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            onNavigateToBackoffice={() => setActiveTab("backoffice")}
          />
        )}

        {/* VIEW 3: STORE BACK-OFFICE & INVENTORY HUB */}
        {activeTab === "backoffice" && (
          <BackofficeView
            products={products}
            orders={orders}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateFulfillment={handleUpdateFulfillment}
            onNavigateToStorefront={() => setActiveTab("storefront")}
          />
        )}

        {/* VIEW 4: NOVA AGENT CHAT & ARTIFACT WORKSPACE (Preserving Dark Mode) */}
        {activeTab === "agent_workspace" && (
          <NovaAgentWorkspaceView
            initialPrompt={agentInitialPrompt}
            onNavigateToStorefront={() => setActiveTab("storefront")}
            onNavigateToCertification={() => setActiveTab("audit")}
          />
        )}

        {/* VIEW 5: 1WITHOUT 6-PILLAR CERTIFICATION MATRIX */}
        {(activeTab === "audit" || activeTab === "shipworthy") && (
          <PreFlightAuditView
            initialAppName={auditInitialAppName}
            initialLiveUrl={auditInitialLiveUrl}
            initialRepoUrl={auditInitialRepoUrl}
            initialStackDesc={auditInitialStackDesc}
            onSendToSkillBuilder={handleSendToSkillBuilder}
            onSaveToRegistry={(audit) => {
              const newApp: AppRegistryItem = {
                id: `app-${Date.now()}`,
                name: audit.appName,
                description: audit.stackDescription || "Audited PWA Application",
                liveUrl: audit.liveUrl,
                repoUrl: audit.repoUrl,
                environment: "Production",
                launchDate: new Date().toISOString().split("T")[0],
                readinessScore: audit.launchReadinessScore,
                status: audit.launchReadinessScore >= 90 ? "Live & Healthy" : "Pre-Flight Pending",
                daysSinceLaunch: 0,
                cadenceStatus: {
                  day30Completed: false,
                  day90Completed: false,
                  day180Completed: false,
                },
                lastAuditId: audit.id,
                activeAlertsCount: audit.launchReadinessScore < 90 ? 1 : 0,
              };
              handleAddApp(newApp);
              setActiveTab("registry");
            }}
          />
        )}

        {/* VIEW 6: DEFENSE-OF-BREAK SECURITY GATE (Preserving Dark Mode) */}
        {activeTab === "defense" && (
          <DefenseGateView
            securityClearance={securityClearance}
            onClearanceUpdated={(clearance) => setSecurityClearance(clearance)}
          />
        )}

        {/* Ancillary Engine Views */}
        {activeTab === "overview" && (
          <OverviewView
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectSample={handleSelectSample}
            onSelectTier={(tierId) => {
              setCurrentTier(tierId);
              setIsCheckoutOpen(true);
            }}
            securityClearance={securityClearance}
          />
        )}

        {activeTab === "discern" && (
          <DiscernView
            initialContent={discernInitialContent}
            initialSourceType={discernInitialSourceType}
            initialSourceUrl={discernInitialSourceUrl}
            onSendToSkillBuilder={handleSendToSkillBuilder}
            securityClearance={securityClearance}
            onOpenDefenseModal={() => setActiveTab("defense")}
          />
        )}

        {activeTab === "skills" && (
          <SkillBuilderView
            initialContent={skillInitialContent}
            initialSkillName={skillInitialName}
            securityClearance={securityClearance}
            onOpenDefenseModal={() => setActiveTab("defense")}
          />
        )}

        {activeTab === "registry" && (
          <RegistryView
            apps={registryApps}
            onAddApp={handleAddApp}
            onRemoveApp={handleRemoveApp}
            onSelectAppForAudit={handleSelectAppForAudit}
          />
        )}
      </main>

      {/* Global Commercial Checkout / Upgrade Modal */}
      <ModalCheckout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        currentTier={currentTier}
        onSelectTier={(tierId) => setCurrentTier(tierId)}
      />

      {/* Unified Footer */}
      <footer
        className={`py-8 text-center text-xs transition-colors duration-200 border-t ${
          isTechnicalDarkMode
            ? "border-slate-900 bg-slate-950 text-slate-500"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isTechnicalDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              OPC Launchpad & 1WithOut Suite
            </span>
            <span>•</span>
            <span>Single Source of Truth Operating System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>WHOIS Domain Engine</span>
            <span>•</span>
            <span>Digital Storefront</span>
            <span>•</span>
            <span>Nova Copilot</span>
            <span>•</span>
            <span>6-Pillar QA Matrix</span>
            <span>•</span>
            <span>Defense-of-Break Sentinel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
