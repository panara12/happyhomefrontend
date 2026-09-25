import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit } from 'lucide-react'
import { useAddUnit, useUpdateUnit, useGetAllUnits } from '../../hooks/useUnit'
// import { useUnitContext } from '../../context/unitContext'
import { useGetAllStores } from '../../hooks/useStore'
import { Pagination } from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'

const THEME = {
  gradientFrom: 'from-indigo-900',
  gradientTo: 'to-purple-900',
  panel: 'bg-indigo-800',
  activeText: 'text-indigo-900',
  idleText: 'text-indigo-100',
}

export default function AddUnit() {
  const [name, setName] = useState('')
  const [originalname, setOriginalname] = useState('')
  const [decimalplaces, setDecimalplaces] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [editing, setEditing] = useState(null)

  const { data:units, isLoading:unitsLoading } = useGetAllUnits()
  const { data: stores, isLoading: storesLoading } = useGetAllStores()

  // ✅ Always call hook at top level — pass empty array as fallback.
  // useMemo (not `units || []` directly) so usePagination's reference
  // comparison doesn't see a fresh [] literal every render → infinite loop.
  const unitList = useMemo(
    () => (Array.isArray(units?.units) ? units.units : []),
    [units],
  )
  const storeList = useMemo(
    () => (Array.isArray(stores?.stores) ? stores.stores : []),
    [stores],
  )
  const pagination = usePagination(unitList)

  const addMutation = useAddUnit()
  const updateMutation = useUpdateUnit()

  useEffect(() => {
    if (!editing) {
      setName('')
      setOriginalname('')
      setDecimalplaces('')
      setCompanyName('')
    } else {
      setName(editing.name || '')
      setOriginalname('') // not persisted in MongoDB today — see note below
      setDecimalplaces('')
      setCompanyName('')
    }
  }, [editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!companyName) return

    if (editing) {
      // Name is intentionally not editable — the Tally Alter payload keys
      // off the existing name, and there's no rename support yet.
      updateMutation.mutate({
        id: editing._id,
        companyName,
        originalname: originalname.trim() || undefined,
        decimalplaces: decimalplaces !== '' ? Number(decimalplaces) : undefined,
      })
      setEditing(null)
    } else {
      addMutation.mutate({
        name: name.trim(),
        originalname: originalname.trim() || undefined,
        companyName,
      })
    }

    setName('')
    setOriginalname('')
    setDecimalplaces('')
    setCompanyName('')
  }

  const handleEdit = (unit) => setEditing(unit)

  if (unitsLoading) {
    return (
      <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
        <div className="flex items-center justify-center h-40">
          <p className="text-indigo-200 text-sm animate-pulse">Loading units...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-md shadow-sm ${THEME.panel} text-white`}>
      <div className={`bg-gradient-to-r ${THEME.gradientFrom} ${THEME.gradientTo} p-4 rounded-md mb-4`}>
        <h2 className="text-2xl font-semibold">Units</h2>
        <p className="text-sm text-indigo-200">Manage units of measure and sync to Tally</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3 md:col-span-1">
          <label className="block text-sm text-indigo-100">Unit name</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white disabled:opacity-50"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. box, kg, nos"
            disabled={!!editing}
          />
          {editing && (
            <p className="text-xs text-indigo-300 -mt-2">
              Name can't be changed here — rename isn't supported yet.
            </p>
          )}

          <label className="block text-sm text-indigo-100">Original name (plural)</label>
          <input
            className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
            value={originalname}
            onChange={(e) => setOriginalname(e.target.value)}
            placeholder="e.g. boxes, kgs"
          />

          {editing && (
            <>
              <label className="block text-sm text-indigo-100">Decimal places</label>
              <input
                type="number"
                min="0"
                max="4"
                className="w-full p-2 rounded border border-indigo-700 bg-indigo-900 text-white"
                value={decimalplaces}
                onChange={(e) => setDecimalplaces(e.target.value)}
                placeholder="e.g. 2"
              />
            </>
          )}

          <label className="block text-sm text-indigo-100">Company</label>
          <select
            className="w-full p-2 rounded border border-black bg-white text-black outline-black"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={storesLoading}
          >
            <option value="">Select company</option>
            {storeList.map((store) => (
              <option key={store._id} value={store.name}>
                {store.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white text-indigo-900 rounded shadow disabled:opacity-50"
              disabled={addMutation.isPending || updateMutation.isPending}
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
                  <th className="p-3">Unit ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unitList.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-400" colSpan={4}>
                      No units found.
                    </td>
                  </tr>
                )}
                {pagination?.paginatedItems.map((unit, idx) => (
                  <tr key={unit._id} className="border-t">
                    <td className="p-3">{(pagination.page - 1) * pagination.pageSize + idx + 1}</td>
                    <td className="p-3">{unit.unitId}</td>
                    <td className="p-3">{unit.name}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleEdit(unit)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <Pagination
              page={pagination.page || 1}
              totalPages={pagination.totalPages || 1}
              totalItems={pagination.totalItems || 0}
              pageSize={pagination.pageSize || 10}
              onPageChange={pagination.goToPage}
          />)}
        </div>
      </div>
    </div>
  )
}
