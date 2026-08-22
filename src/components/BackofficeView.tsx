import React, { useState } from "react";
import { ProductItem, StoreOrder } from "../types";
import {
  Plus,
  Trash2,
  CheckCircle,
  DollarSign,
  Boxes,
  Eye,
  EyeOff,
  ShoppingBag,
} from "lucide-react";

interface BackofficeViewProps {
  products: ProductItem[];
  orders: StoreOrder[];
  onAddProduct: (prod: ProductItem) => void;
  onUpdateProduct: (prod: ProductItem) => void;
  onDeleteProduct: (prodId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: "PAID" | "PENDING" | "REFUNDED" | "FAILED") => void;
  onUpdateFulfillment: (orderId: string, status: "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED") => void;
  onNavigateToStorefront?: () => void;
}

export const BackofficeView: React.FC<BackofficeViewProps> = ({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateFulfillment,
  onNavigateToStorefront,
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New product draft state
  const [draftTitle, setDraftTitle] = useState<string>("Spotify Audio Sound Kit Pro Edition");
  const [draftDesc, setDraftDesc] = useState<string>("Complete mastering pack, MIDI stems, and Spotify canvas visuals for indie creators.");
  const [draftPrice, setDraftPrice] = useState<number>(49.0);
  const [draftCategory, setDraftCategory] = useState<string>("Audio & Sound Kits");
  const [draftQty, setDraftQty] = useState<number>(50);
  const [draftTags, setDraftTags] = useState<string>("Spotify, Audio, MIDI, SoundKit");

  const totalRevenue = orders.reduce((sum, o) => (o.paymentStatus === "PAID" ? sum + o.total : sum), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      title: draftTitle,
      description: draftDesc,
      price: Number(draftPrice),
      category: draftCategory,
      inventoryQty: Number(draftQty),
      isPublished: true,
      tags: draftTags.split(",").map((t) => t.trim()),
      rating: 5.0,
      variants: [
        { id: `v-${Date.now()}-1`, name: "Standard License", sku: `SKU-${Date.now().toString().slice(-4)}`, price: Number(draftPrice), inventoryQty: Number(draftQty) },
      ],
    };

    onAddProduct(newProd);
    setIsAddModalOpen(false);
    setDraftTitle("");
    setDraftDesc("");
  };

  return (
    <div id="backoffice-root" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* ------------------------------------------------------------- */}
      {/* BACKOFFICE HEADER & METRICS CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Boxes className="w-3.5 h-3.5 text-cyan-600" />
            <span>Store Back-Office & Real-Time Inventory Control</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Order Fulfillment Hub
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage catalog items, track incoming customer orders, configure variant tiers, and monitor sales channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToStorefront && (
            <button
              type="button"
              onClick={onNavigateToStorefront}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              Preview Live Storefront
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">${totalRevenue.toFixed(2)}</div>
          <p className="text-[11px] text-emerald-700 font-medium">Synced with Stripe & Shopify Checkout</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Processed Orders</span>
            <ShoppingBag className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalOrdersCount}</div>
          <p className="text-[11px] text-slate-500 font-medium">100% Idempotent Payment Handshake</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Active Catalog SKUs</span>
            <Boxes className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalProductsCount}</div>
          <p className="text-[11px] text-teal-700 font-medium">Stock Levels Verified in Real Time</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TABS NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-white text-emerald-800 border border-slate-200 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Product Catalog ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-white text-emerald-800 border border-slate-200 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customer Orders ({orders.length})
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: PRODUCT LIST & CONTROLS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6">Product & Category</th>
                      <th className="py-4 px-6">Price</th>
                      <th className="py-4 px-6">Stock Qty</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 space-y-1">
                          <div className="font-bold text-slate-900 text-sm">{prod.title}</div>
                          <div className="text-[11px] text-emerald-700 font-mono">{prod.category}</div>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                          ${prod.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`font-mono font-bold ${
                              prod.inventoryQty < 10 ? "text-rose-600" : "text-slate-700"
                            }`}
                          >
                            {prod.inventoryQty} units
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateProduct({ ...prod, isPublished: !prod.isPublished })
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              prod.isPublished
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {prod.isPublished ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                <span>Archived</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ORDER MANAGEMENT TABLE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Order ID & Customer</th>
                    <th className="py-4 px-6">Items Summary</th>
                    <th className="py-4 px-6">Total</th>
                    <th className="py-4 px-6">Payment Rail</th>
                    <th className="py-4 px-6">Payment Status</th>
                    <th className="py-4 px-6">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="font-mono font-bold text-slate-900">{ord.orderNumber}</div>
                        <div className="text-slate-500 text-[11px]">{ord.customerEmail}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {ord.items.map((it) => (
                          <div key={it.product.id}>
                            • {it.quantity}x {it.product.title}
                          </div>
                        ))}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-800 text-sm">
                        ${ord.total.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {ord.paymentRail}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            ord.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>{ord.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={ord.fulfillmentStatus}
                          onChange={(e) =>
                            onUpdateFulfillment(ord.id, e.target.value as any)
                          }
                          className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="UNFULFILLED">UNFULFILLED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADD PRODUCT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-900">
            <h3 className="text-xl font-bold text-slate-900">Create New Catalog Product</h3>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. Spotify Audio Sound Kit Engine"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  placeholder="Explain what the product, license, or kit provides..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    value={draftQty}
                    onChange={(e) => setDraftQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
