// =============================================================================
// Reward Items Manager — Items contained within a reward.
// Each item can be physical or digital, with fulfilment details.
// =============================================================================

import { useState } from "react";
import { Plus, Trash2, Package, Download, GripVertical } from "lucide-react";
import type { RewardItemFormData } from "./RewardManager";

interface Props {
  items: RewardItemFormData[];
  onChange: (items: RewardItemFormData[]) => void;
  onAddItem: () => void;
}

export function RewardItemsManager({ items, onChange, onAddItem }: Props) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const updateItem = (id: string, updates: Partial<RewardItemFormData>) => {
    onChange(items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    onChange(next);
    if (expandedItemId === id) setExpandedItemId(null);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-primary-600" />
        Reward Items
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        What does the participant receive? Add one or more items.
      </p>

      {/* Items List */}
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">No items added yet.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {items.map((item, index) => {
            const isExpanded = expandedItemId === item.id;
            return (
              <div key={item.id} className="rounded-lg bg-white border border-gray-200">
                {/* Item Header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                >
                  <GripVertical className="h-3 w-3 text-gray-300" />
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-primary-100 text-[10px] font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] ${
                    item.physicalType === "physical"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {item.physicalType === "physical"
                      ? <Package className="h-3 w-3" />
                      : <Download className="h-3 w-3" />
                    }
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                    {item.title || "Untitled Item"}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    {item.physicalType}
                  </span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                    className="text-gray-400 hover:text-red-600 p-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expanded Item Form */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-3 py-3 space-y-2">
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => updateItem(item.id, { title: e.target.value })}
                        placeholder="e.g. £50 Digital E-Card"
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={e => updateItem(item.id, { description: e.target.value })}
                        placeholder="Describe this item..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Physical/Digital + Quantity */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">
                          Format
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { physicalType: "digital" })}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium ${
                              item.physicalType === "digital"
                                ? "border-purple-300 bg-purple-50 text-purple-700"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            <Download className="h-3 w-3" />
                            Digital
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { physicalType: "physical" })}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium ${
                              item.physicalType === "physical"
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            <Package className="h-3 w-3" />
                            Physical
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(item.id, { quantity: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Digital Asset Config */}
                    {item.physicalType === "digital" && (
                      <div className="space-y-2 rounded-lg bg-purple-50 p-2.5">
                        <label className="block text-[10px] font-bold text-purple-700">
                          Digital Asset
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { assetType: "url" })}
                            className={`flex-1 rounded-lg border px-2 py-1 text-[10px] font-medium ${
                              item.assetType === "url"
                                ? "border-purple-300 bg-white text-purple-700"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            URL Link
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { assetType: "file" })}
                            className={`flex-1 rounded-lg border px-2 py-1 text-[10px] font-medium ${
                              item.assetType === "file"
                                ? "border-purple-300 bg-white text-purple-700"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            File Upload
                          </button>
                        </div>
                        {item.assetType === "url" && (
                          <input
                            type="url"
                            value={item.assetUrl}
                            onChange={e => updateItem(item.id, { assetUrl: e.target.value })}
                            placeholder="https://example.com/e-card"
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none"
                          />
                        )}
                        {item.assetType === "file" && (
                          <div>
                            <input
                              type="text"
                              value={item.assetFileName}
                              onChange={e => updateItem(item.id, { assetFileName: e.target.value })}
                              placeholder="File name (e.g. ecard.pdf)"
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm bg-white focus:border-primary-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-purple-500 mt-1">
                              File upload will be handled after reward is saved.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Button */}
      <button
        type="button"
        onClick={onAddItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Item
      </button>
    </div>
  );
}
