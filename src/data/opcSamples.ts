import { ProductItem, StoreOrder, DomainSuggestion, BrandKit } from "../types";

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "1WithOut Pro Enterprise PWA Sentinel",
    description: "Full-stack automated Docker worker testing runner with 3-persona chaos simulation, Port 3000 Ingress verification, and PDF certification reports.",
    price: 99.0,
    category: "Software & Agents",
    inventoryQty: 45,
    isPublished: true,
    tags: ["PWA", "Enterprise", "Chaos Testing", "Automated QA"],
    rating: 4.9,
    variants: [
      { id: "v1-monthly", name: "1 Month License (Single Node)", sku: "SENTINEL-1M", price: 99.0, inventoryQty: 100 },
      { id: "v1-annual", name: "Annual Enterprise (Unlimited Nodes)", sku: "SENTINEL-1Y", price: 890.0, inventoryQty: 50 },
    ],
    modifiers: [
      {
        id: "mod-support",
        name: "Dedicated SLA Support",
        required: false,
        options: [
          { id: "sla-none", name: "Standard Community Support", priceDelta: 0 },
          { id: "sla-247", name: "24/7 Dedicated SRE Priority Channel (+$150/mo)", priceDelta: 150 },
        ],
      },
    ],
  },
  {
    id: "prod-2",
    title: "Spotify App Merch & Sync Engine",
    description: "Automated music playlist sync engine, merchandise inventory management, Shopify token pass-through, and digital sound kit storefront.",
    price: 49.0,
    category: "E-Commerce Integrations",
    inventoryQty: 120,
    isPublished: true,
    tags: ["Spotify", "Music Tech", "Storefront", "Digital Merch"],
    rating: 4.8,
    variants: [
      { id: "v2-solo", name: "Creator Solo Tier", sku: "SPOTIFY-SOLO", price: 49.0, inventoryQty: 200 },
      { id: "v2-label", name: "Record Label & Collective Tier", sku: "SPOTIFY-LABEL", price: 199.0, inventoryQty: 80 },
    ],
  },
  {
    id: "prod-3",
    title: "Axe-Core™ WCAG 2.1 AA Compliance Suite",
    description: "Automated real-time DOM accessibility validator, color contrast ratio checker, ARIA landmark enforcement, and Playwright A11y regression exporter.",
    price: 39.0,
    category: "Developer Tools",
    inventoryQty: 999,
    isPublished: true,
    tags: ["Accessibility", "WCAG 2.1", "Axe-Core", "ARIA"],
    rating: 5.0,
  },
  {
    id: "prod-4",
    title: "Nova Agent MCP Protocol Server Kit",
    description: "Pre-configured Model Context Protocol (MCP) server container, AGENTS.md generator, and WebSocket streaming bridge for Claude, Gemini, and OpenAI agents.",
    price: 79.0,
    category: "AI Protocols & MCP",
    inventoryQty: 60,
    isPublished: true,
    tags: ["MCP", "AGENTS.md", "WebSockets", "VibeCoding"],
    rating: 4.95,
  },
  {
    id: "prod-5",
    title: "Defense-of-Break Security Sentinel",
    description: "Zero-tolerance compliance gate blocking unauthorized corporate liquidation data, medical PII leaks, and rogue database schema drops.",
    price: 129.0,
    category: "Security & Governance",
    inventoryQty: 30,
    isPublished: true,
    tags: ["Security Gate", "PII Redaction", "HIPAA", "Zero-Tolerance"],
    rating: 4.9,
  },
];

export const INITIAL_ORDERS: StoreOrder[] = [
  {
    id: "ord-1001",
    orderNumber: "OPC-89211",
    customerEmail: "sarah.dev@orbitlabs.io",
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1,
        selectedVariant: INITIAL_PRODUCTS[0].variants?.[0],
        unitPrice: 99.0,
      },
    ],
    subtotal: 99.0,
    tax: 7.92,
    total: 106.92,
    paymentStatus: "PAID",
    fulfillmentStatus: "DELIVERED",
    createdAt: "2026-08-21T14:32:00Z",
    paymentRail: "Shopify Checkout",
  },
  {
    id: "ord-1002",
    orderNumber: "OPC-89212",
    customerEmail: "alex@soundwavecreators.com",
    items: [
      {
        product: INITIAL_PRODUCTS[1],
        quantity: 2,
        selectedVariant: INITIAL_PRODUCTS[1].variants?.[0],
        unitPrice: 49.0,
      },
    ],
    subtotal: 98.0,
    tax: 7.84,
    total: 105.84,
    paymentStatus: "PAID",
    fulfillmentStatus: "PROCESSING",
    createdAt: "2026-08-21T19:15:00Z",
    paymentRail: "Stripe",
  },
];

export const INITIAL_DOMAIN_SUGGESTIONS: DomainSuggestion[] = [
  {
    domain: "1without.io",
    tld: ".io",
    pricePerYear: 38.0,
    isAvailable: true,
    whoisStatus: "AVAILABLE",
    registrarBadge: "Cloudflare",
    seoScore: 98,
    fitReason: "Direct exact match for 1WithOut single-source-of-truth brand architecture.",
  },
  {
    domain: "novalaunch.dev",
    tld: ".dev",
    pricePerYear: 14.0,
    isAvailable: true,
    whoisStatus: "AVAILABLE",
    registrarBadge: "Google Domains",
    seoScore: 94,
    fitReason: "High relevance for developer-centric agentic platform and MCP tools.",
  },
  {
    domain: "opclaunchpad.ai",
    tld: ".ai",
    pricePerYear: 75.0,
    isAvailable: true,
    whoisStatus: "AVAILABLE",
    registrarBadge: "Vercel",
    seoScore: 96,
    fitReason: "Premium AI top-level domain for solo founder / one-person-company ecosystem.",
  },
  {
    domain: "spotifystore.app",
    tld: ".app",
    pricePerYear: 19.0,
    isAvailable: false,
    whoisStatus: "REGISTERED",
    registrarBadge: "Namecheap",
    seoScore: 88,
    fitReason: "Taken. Recommended alternatives: spotifystorefront.io or spotsync.dev.",
  },
  {
    domain: "vibecoding.sh",
    tld: ".sh",
    pricePerYear: 28.0,
    isAvailable: true,
    whoisStatus: "AVAILABLE",
    registrarBadge: "Cloudflare",
    seoScore: 92,
    fitReason: "Punchy terminal-first domain for natural language prompt-driven engineers.",
  },
];

export const INITIAL_BRAND_KIT: BrandKit = {
  brandName: "OPC Launchpad & 1WithOut",
  tagline: "Perfect domain. Launch-ready copy. Certified Shipworthy.",
  valueProposition: "Transform natural language ideas into WHOIS-verified domains, high-converting brand copy, e-commerce storefronts, and automated 6-pillar certified PWAs.",
  targetAudience: "Solo founders, indie developers, one-person companies (OPCs), and autonomous AI agent architects.",
  voiceTone: "Authoritative, empirical, transparent, high-precision engineering, anti-hype.",
  primaryOklchColor: "oklch(0.65 0.20 160)", // Emerald Vibrant
  secondaryOklchColor: "oklch(0.60 0.18 250)", // Cyan / Indigo Electric
  neutralBgColor: "oklch(0.12 0.02 260)", // Deep Slate 950
  typographyHeading: "Inter & Space Grotesk High-Contrast",
  typographyBody: "Plus Jakarta Sans & JetBrains Mono",
  elevatorPitch: "Build, verify, and commercialize your startup in minutes. We provide instant WHOIS domain discovery, an integrated digital storefront, Claude/Gemini-powered Nova Agent workspace, and 1WithOut 6-pillar empirical validation.",
};
