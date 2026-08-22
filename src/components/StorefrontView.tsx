import React, { useState } from "react";
import { ProductItem, CartLineItem, ProductVariant, ProductModifierOption } from "../types";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  Star,
  Sparkles,
  Search,
  X,
  CreditCard,
} from "lucide-react";

interface StorefrontViewProps {
  products: ProductItem[];
  cart: CartLineItem[];
  onAddToCart: (product: ProductItem, variant?: ProductVariant, modifiers?: Record<string, ProductModifierOption>) => void;
  onUpdateCartQty: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onNavigateToBackoffice?: () => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  onNavigateToBackoffice,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalProduct, setActiveModalProduct] = useState<ProductItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ProductModifierOption>>({});
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch && p.isPublished;
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartTax = cartSubtotal * 0.08;
  const cartTotal = cartSubtotal + cartTax;

  const handleOpenProductModal = (prod: ProductItem) => {
    setActiveModalProduct(prod);
    setSelectedVariant(prod.variants?.[0]);
    setSelectedModifiers({});
  };

  const handleConfirmAddToCart = () => {
    if (!activeModalProduct) return;
    onAddToCart(activeModalProduct, selectedVariant, selectedModifiers);
    setActiveModalProduct(null);
    setIsCartDrawerOpen(true);
  };

  const handlePerformCheckout = () => {
    onCheckout();
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setIsCartDrawerOpen(false);
    }, 2500);
  };

  return (
    <div id="storefront-root" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* ------------------------------------------------------------- */}
      {/* STOREFRONT HEADER & CART TOGGLE */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>OPC Digital Storefront & Spotify Merch Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Curated Products & Micro-SaaS Catalog
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Automated e-commerce catalog featuring Spotify audio kits, PWA Sentinel licenses, and developer tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToBackoffice && (
            <button
              type="button"
              onClick={onNavigateToBackoffice}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              Back-Office Inventory
            </button>
          )}

          <button
            id="open-cart-drawer-btn"
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-100" />
            <span>View Cart</span>
            {cartTotalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[11px] font-extrabold shadow-xs">
                {cartTotalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FILTER & SEARCH BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, licenses, audio kits..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-100 text-emerald-800 border border-slate-200 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRODUCT GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 p-6 flex flex-col justify-between space-y-5 transition-all shadow-sm hover:shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  {prod.category}
                </span>
                {prod.rating && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{prod.rating}</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {prod.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {prod.description}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {prod.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Starting at</span>
                <span className="text-2xl font-extrabold text-slate-900">${prod.price.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenProductModal(prod)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Configure & Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRODUCT DETAIL / MODIFIER MODAL */}
      {/* ------------------------------------------------------------- */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  {activeModalProduct.category}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {activeModalProduct.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeModalProduct.description}
            </p>

            {/* Variants Picker */}
            {activeModalProduct.variants && activeModalProduct.variants.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select License / Variant Tier:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {activeModalProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer transition-all ${
                        selectedVariant?.id === v.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="font-bold text-slate-900">${v.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers / Addons */}
            {activeModalProduct.modifiers && (
              <div className="space-y-2">
                {activeModalProduct.modifiers.map((mod) => (
                  <div key={mod.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {mod.name} {mod.required && <span className="text-rose-600">*</span>}
                    </label>
                    <div className="space-y-1">
                      {mod.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedModifiers((prev) => ({
                              ...prev,
                              [mod.id]: opt,
                            }))
                          }
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs cursor-pointer ${
                            selectedModifiers[mod.id]?.id === opt.id
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="text-slate-600">{opt.priceDelta > 0 ? `+$${opt.priceDelta}` : "Included"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Final Unit Price</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  $
                  {(
                    (selectedVariant ? selectedVariant.price : activeModalProduct.price) +
                    Object.values(selectedModifiers).reduce((s, m) => s + m.priceDelta, 0)
                  ).toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SLIDE-OUT CART DRAWER */}
      {/* ------------------------------------------------------------- */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white border-l border-slate-200 w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right text-slate-900">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-900">Your Cart ({cartTotalCount})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500">Your cart is currently empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.product.title}</h4>
                          {item.selectedVariant && (
                            <span className="text-[11px] text-emerald-800 block font-mono">
                              Tier: {item.selectedVariant.name}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-600">
                            ${item.unitPrice.toFixed(2)} each
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.product.id, -1)}
                            className="text-slate-600 hover:text-slate-900 p-0.5 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 px-1.5">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.product.id, 1)}
                            className="text-slate-600 hover:text-slate-900 p-0.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-extrabold text-emerald-800">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Summary & Checkout Button */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-900 font-medium">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (8%):</span>
                    <span className="text-slate-900 font-medium">${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-emerald-800">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {checkoutSuccess ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Order Placed Successfully! Synced with Shopify.</span>
                  </div>
                ) : (
                  <button
                    id="checkout-shopify-btn"
                    type="button"
                    onClick={handlePerformCheckout}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/10 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Shopify / Stripe Checkout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
