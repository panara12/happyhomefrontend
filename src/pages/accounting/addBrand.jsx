import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useAddStockGroup, useDeleteStockGroup, useUpdateStockGroup } from '../../hooks/useStockGroup'
import { useStockGroupContext } from '../../context/stockgroupContext'
import { Pagination } from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'

const THEME = {
  gradientFrom: 'from-indigo-900',
  gradientTo: 'to-purple-900',
  panel: 'bg-indigo-800',
  activeText: 'text-indigo-900',
  idleText: 'text-indigo-100',
}

export default function AddBrand() {
  const [name, setName] = useState('')
  const [brandCode, setBrandCode] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [editing, setEditing] = useState(null)

  const { stockGroup, stockGroupLoading: isLoading } = useStockGroupContext()

  // ✅ Always call hook at top level — pass empty array as fallback
  // See AddCategory.jsx for why this needs useMemo, not `stockGroup || []`
  // directly: usePagination resets page state by reference-comparing items,
  // and a fresh [] literal every render never stabilizes → infinite loop.
  const brands = useMemo(() => stockGroup || [], [stockGroup])

  const addMutation    = useAddStockGroup()
  const updateMutation = useUpdateStockGroup()
  const deleteMutation = useDeleteStockGroup()

  // const pagination = usePagination(stockGroup)
  // console.log(pagination)

  useEffect(() => {
    if (!editing) {
      setName('')
      setBrandCode('')
    } else {
      setName(editing.name || '')
      setBrandCode(editing.brand_code || '')
    }
  }, [editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editing) {
      updateMutation.mutate({
        id: editing._id,
        name: name.trim(),
        brand_code: brandCode.trim(),
        gstNumber: gstNumber.trim()
      })
      setEditing(null)
    } else {
      addMutation.mutate({ name: name.trim(), brand_code: brandCode.trim(), gstNumber:gstNumber.trim() })
    }
    setName('')
    setBrandCode('')
    setGstNumber('')
  }

  const handleEdit   = (brand) => setEditing(brand)
  const handleDelete = (brand) => {
    if (!confirm(`Delete brand "${brand.name}"?`)) return
    deleteMutation.mutate(brand._id)
  }

  // ✅ Loading state AFTER all hooks are called
  if (isLoading) {
    return (
      <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
        <div className="flex items-center justify-center h-40">
          <p className="text-indigo-200 text-sm animate-pulse">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
      <div className={`bg-gradient-to-r ${THEME.gradientFrom} ${THEME.gradientTo} p-4 rounded-md mb-4`}>
        <h2 className="text-2xl font-semibold">Brands</h2>
        <p className="text-sm text-indigo-200">Manage stock brands (stock groups) for Accounting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3 md:col-span-1">
          <label className="block text-sm text-indigo-100">Brand name</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter brand name"
          />

          <label className="block text-sm text-indigo-100">Brand code</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
            value={brandCode}
            onChange={(e) => setBrandCode(e.target.value)}
            placeholder="Enter brand code"
          />

          <label className="block text-sm text-indigo-100">GST Number</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="Enter brand code"
          />

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
                  <th className="p-3">Stock Group ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Brand Code</th>
                  <th className="p-3">GST Number</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-400" colSpan={5}>
                      No brands found.
                    </td>
                  </tr>
                )}
                {brands.map((brand, idx) => (
                  <tr key={brand._id} className="border-t">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{brand.stockGroupId}</td>
                    <td className="p-3">{brand.name}</td>
                    <td className="p-3">{brand.brand_code}</td>
                    <td className="p-3">{brand.gstNumber}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand)}
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
{/* 
          <Pagination
            page={pagination?.page || 1}
            totalPages={pagination?.totalPages || 1}
            totalItems={pagination?.totalItems || 0}
            pageSize={pagination?.pageSize || 10}
            onPageChange={pagination?.goToPage}
          /> */}
        </div>
      </div>
    </div>
  )
}