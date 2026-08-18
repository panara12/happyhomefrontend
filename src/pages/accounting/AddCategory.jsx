import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useAddStockCategory, useDeleteStockCategory, useGetAllStockCategory, useUpdateStockCategory } from '../../hooks/useStockCategory'
import { useStockCategoryContext } from '../../context/stockcategoryContext'

const THEME = {
  gradientFrom: 'from-indigo-900',
  gradientTo: 'to-purple-900',
  panel: 'bg-indigo-800',
  activeText: 'text-indigo-900',
  idleText: 'text-indigo-100',
}

export default function AddCategory() {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)

  const { stockCategory:categories, stockCategoryLoading:isLoading  } = useStockCategoryContext()
  // console.log(getAllRes)
  // const categories = getAllRes?.data || []

  const addMutation = useAddStockCategory()

  const updateMutation = useUpdateStockCategory()

  const deleteMutation = useDeleteStockCategory()

  useEffect(() => {
    if (!editing) setName('')
    else setName(editing.name || '')
  }, [editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editing) {
      updateMutation.mutate({ name: name.trim(), categoryId: editing.categoryId })
      setEditing(null)
    } else {
      addMutation.mutate({ name: name.trim() })
    }
    setName('')
  }

  const handleEdit = (cat) => setEditing(cat)
  const handleDelete = (cat) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    deleteMutation.mutate(cat.categoryId)
  }

  return (
    <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
      <div className={`bg-gradient-to-r ${THEME.gradientFrom} ${THEME.gradientTo} p-4 rounded-md mb-4`}>
        <h2 className="text-2xl font-semibold">Categories</h2>
        <p className="text-sm text-indigo-200">Manage stock categories for Accounting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="space-y-3 md:col-span-1">
          <label className="block text-sm text-indigo-100">Category name</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
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

        <div className="md:col-span-2">
          <div className="bg-white text-black rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-left">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Category ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td className="p-4" colSpan={4}>Loading...</td></tr>
                )}
                {!isLoading && categories.length === 0 && (
                  <tr><td className="p-4" colSpan={4}>No categories found.</td></tr>
                )}
                {categories.map((cat, idx) => (
                  <tr key={cat._id} className="border-t">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">{cat.categoryId}</td>
                    <td className="p-3">{cat.name}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(cat)} className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(cat)} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
