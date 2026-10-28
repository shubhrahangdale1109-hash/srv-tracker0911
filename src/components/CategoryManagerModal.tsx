/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, AlertTriangle, Tag } from 'lucide-react';
import { TaskCategory, TaskItem } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: TaskCategory[];
  tasks: TaskItem[];
  onClose: () => void;
  onSaveCategory: (category: TaskCategory) => void;
  onDeleteCategory: (categoryId: string, reassignmentOption: 'delete-all' | 'reassign', targetCategoryId?: string) => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Mint Green
  '#f59e0b', // Amber / Orange
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  tasks,
  onClose,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);

  // Delete confirmation state
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<TaskCategory | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCatId('new');
    setCatName('');
    setCatColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  const handleStartEdit = (cat: TaskCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatColor(cat.color || PRESET_COLORS[0]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCatId === 'new') {
      const newCat: TaskCategory = {
        id: `cat-${Date.now()}`,
        name: catName.trim(),
        color: catColor,
        icon: 'Tag',
      };
      onSaveCategory(newCat);
    } else if (editingCatId) {
      const existing = categories.find((c) => c.id === editingCatId);
      if (existing) {
        onSaveCategory({
          ...existing,
          name: catName.trim(),
          color: catColor,
        });
      }
    }

    setEditingCatId(null);
    setCatName('');
  };

  const handleInitiateDelete = (cat: TaskCategory) => {
    const tasksCount = tasks.filter((t) => t.categoryId === cat.id).length;
    if (tasksCount === 0) {
      // Direct delete
      onDeleteCategory(cat.id, 'delete-all');
    } else {
      // Show prompt
      const otherCats = categories.filter((c) => c.id !== cat.id);
      setReassignTargetId(otherCats[0]?.id || '');
      setCategoryPendingDelete(cat);
    }
  };

  const executeDelete = (option: 'delete-all' | 'reassign') => {
    if (!categoryPendingDelete) return;
    onDeleteCategory(categoryPendingDelete.id, option, option === 'reassign' ? reassignTargetId : undefined);
    setCategoryPendingDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Manage Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {categoryPendingDelete ? (
            /* Sub-dialog: Deletion with existing tasks */
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    Delete &ldquo;{categoryPendingDelete.name}&rdquo;?
                  </h3>
                  <p className="text-xs text-amber-700 mt-1">
                    This category contains{' '}
                    <span className="font-bold">
                      {tasks.filter((t) => t.categoryId === categoryPendingDelete.id).length}
                    </span>{' '}
                    task(s). How would you like to handle these tasks?
                  </p>
                </div>
              </div>

              {categories.filter((c) => c.id !== categoryPendingDelete.id).length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reassign tasks to another category:
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories
                      .filter((c) => c.id !== categoryPendingDelete.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {categories.filter((c) => c.id !== categoryPendingDelete.id).length > 0 && (
                  <button
                    type="button"
                    onClick={() => executeDelete('reassign')}
                    className="w-full py-2.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors text-center"
                  >
                    Reassign Tasks & Delete Category
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => executeDelete('delete-all')}
                  className="w-full py-2.5 px-3 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-xl transition-colors text-center"
                >
                  Delete Category and All Its Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryPendingDelete(null)}
                  className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors text-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Add / Edit Form */}
              {editingCatId ? (
                <form onSubmit={handleSave} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {editingCatId === 'new' ? 'New Category' : 'Edit Category'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Project Work"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Color Accent</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCatColor(c)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            catColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save Category
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-dashed border-indigo-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Custom Category
                </button>
              )}

              {/* Categories List */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Existing Categories ({categories.length})
                </span>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                  {categories.map((cat) => {
                    const count = tasks.filter((t) => t.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: cat.color || '#6366f1' }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                            <p className="text-xs text-slate-400">{count} task{count === 1 ? '' : 's'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Category Name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInitiateDelete(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
