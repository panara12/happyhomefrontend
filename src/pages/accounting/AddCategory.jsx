import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useAddStockCategory, useDeleteStockCategory, useUpdateStockCategory } from '../../hooks/useStockCategory'
import { useGetAllStores } from '../../hooks/useStore'
import { useStockCategoryContext } from '../../context/stockcategoryContext'
import { Pagination } from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'

const THEME = {
  gradientFrom: 'from-indigo-900',
  gradientTo: 'to-purple-900',
  panel: 'bg-indigo-800',
  activeText: 'text-indigo-900',
  idleText: 'text-indigo-100',
}

export default function AddCategory() {
  const [name, setName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [editing, setEditing] = useState(null)

  const { stockCategory, stockCategoryLoading: isLoading } = useStockCategoryContext()
  const { data: storeResponse, isLoading: storesLoading } = useGetAllStores()
  const stores = useMemo(() => storeResponse?.stores || [], [storeResponse])

  // ✅ Always call hook at top level, every render — pass empty array as
  // fallback while data is still loading. Never call this conditionally:
  // React requires the same hooks in the same order on every render, and
  // gating this behind `isLoading` desyncs the hook count between the
  // "loading" render and the "loaded" render, which is what was causing
  // `pagination` to come back empty/stale.
  // useMemo (not `stockCategory || []`) matters here: usePagination resets
  // its page state by comparing `items` by reference. A fresh `[]` literal
  // on every render never becomes stable, which causes an infinite
  // "setState during render" loop ("Too many re-renders").
  const categories = useMemo(() => stockCategory || [], [stockCategory])
  const pagination = usePagination(categories)

  const addMutation    = useAddStockCategory()
  const updateMutation = useUpdateStockCategory()
  const deleteMutation = useDeleteStockCategory()

  useEffect(() => {
    if (!editing) {
      setName('')
      setStoreId('')
    } else {
      setName(editing.name || '')
      setStoreId(editing.storeId || '')
    }
  }, [editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !storeId) return
    if (editing) {
      updateMutation.mutate({ id: editing._id, name: name.trim(), categoryId: editing.categoryId, storeId })
      setEditing(null)
    } else {
      addMutation.mutate({ name: name.trim(), storeId })
    }
    setName('')
    setStoreId('')
  }

  const handleEdit   = (cat) => setEditing(cat)
  const handleDelete = (cat) => {
    if (!cat?.categoryId) return
    if (!confirm(`Delete category "${cat.name}"?`)) return
    deleteMutation.mutate(cat.categoryId)
  }

  // ✅ Loading state AFTER all hooks are called
  if (isLoading || storesLoading) {
    return (
      <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
        <div className="flex items-center justify-center h-40">
          <p className="text-indigo-200 text-sm animate-pulse">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
      <div className={`bg-gradient-to-r ${THEME.gradientFrom} ${THEME.gradientTo} p-4 rounded-md mb-4`}>
        <h2 className="text-2xl font-semibold">Categories</h2>
        <p className="text-sm text-indigo-200">Manage stock categories for Accounting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3 md:col-span-1">
          <label className="block text-sm text-indigo-100">Category name</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
          />

          <label className="block text-sm text-indigo-100">Store</label>
          <select
            className="w-full p-2 rounded border border-black bg-white text-black outline-black"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            disabled={storesLoading}
            required
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store._id || store.storeId} value={store.storeId}>
                {store.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white text-indigo-900 rounded shadow"
            >
              <Plus size={16} /> {editing ? 'Update' : 'Add'}
            </button>
            {editing && (
              <button
                type="button"
                className="px-3 py-2 bg-indigo-600 rounded"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ── Table ── */}
        <div className="md:col-span-2">
          <div className="bg-white text-black rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-left">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Category ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-400" colSpan={5}>
                      No categories found.
                    </td>
                  </tr>
                )}
                {pagination.paginatedItems.map((cat, idx) => (
                  <tr key={cat._id} className="border-t">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{cat.categoryId}</td>
                    <td className="p-3">{cat.name}</td>
                    <td className="p-3">{stores.find((store) => store.storeId === cat.storeId)?.name || cat.storeId}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            totalItems={pagination?.totalItems || 0}
            pageSize={pagination?.pageSize || 10}
            onPageChange={pagination?.goToPage}
          />
        </div>
      </div>
    </div>
  )
}