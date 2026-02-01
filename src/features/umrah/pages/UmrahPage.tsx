import { useState, useCallback } from 'react'
import {
  Plus,
  Plane,
  Calendar,
  DollarSign,
  Users,
  Edit,
  Trash2,
} from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import {
  CreateTripModal,
  EditTripModal,
  DeleteTripModal,
  RegisterPilgrimModal,
  EditPilgrimModal,
  DeletePilgrimModal,
  PilgrimDetailModal,
  UpdateVisaStatusModal,
} from '../components'
import { useTrips, useRegistrations } from '../hooks'
import type { Trip, TripRegistration } from '../types'

type TabType = 'trips' | 'pilgrims'

export default function UmrahPage() {
  const { currentOrganization } = useOrganization()

  const [activeTab, setActiveTab] = useState<TabType>('trips')
  const [selectedTripId, setSelectedTripId] = useState<string>('')

  // Trip modals
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false)
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false)
  const [isDeleteTripModalOpen, setIsDeleteTripModalOpen] = useState(false)
  const [selectedTripForEdit, setSelectedTripForEdit] = useState<string | null>(null)
  const [selectedTripForDelete, setSelectedTripForDelete] = useState<Trip | null>(null)

  // Pilgrim modals
  const [isRegisterPilgrimModalOpen, setIsRegisterPilgrimModalOpen] = useState(false)
  const [isEditPilgrimModalOpen, setIsEditPilgrimModalOpen] = useState(false)
  const [isDeletePilgrimModalOpen, setIsDeletePilgrimModalOpen] = useState(false)
  const [isPilgrimDetailModalOpen, setIsPilgrimDetailModalOpen] = useState(false)
  const [isUpdateVisaStatusModalOpen, setIsUpdateVisaStatusModalOpen] = useState(false)

  const [selectedPilgrimForEdit, setSelectedPilgrimForEdit] = useState<string | null>(null)
  const [selectedPilgrimForDelete, setSelectedPilgrimForDelete] = useState<TripRegistration | null>(null)
  const [selectedPilgrimForDetail, setSelectedPilgrimForDetail] = useState<TripRegistration | null>(null)
  const [selectedPilgrimForVisa, setSelectedPilgrimForVisa] = useState<TripRegistration | null>(null)

  const [selectedPilgrimIds, setSelectedPilgrimIds] = useState<string[]>([])

  // Use trips hook
  const {
    trips,
    isLoading: tripsLoading,
    refetch: refetchTrips,
  } = useTrips({ organizationId: currentOrganization?.id })

  // Use registrations hook for selected trip
  const {
    registrations: pilgrims = [],
    isLoading: pilgrimsLoading,
    refetch: refetchPilgrims,
  } = useRegistrations({
    tripId: selectedTripId || undefined,
    organizationId: currentOrganization?.id,
  })

  // Auto-select first trip when switching to pilgrims tab
  if (activeTab === 'pilgrims' && !selectedTripId && trips.length > 0) {
    setSelectedTripId(trips[0].id)
  }

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const formatCurrency = useCallback((amount: number | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }, [])

  const getStatusColor = (status: string | null) => {
    return status === 'Open'
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
  }

  const getVisaStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      Rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    }
    return colors[status || ''] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
  }

  const getPaymentStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      Unpaid: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      Partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      Paid: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    }
    return colors[status || ''] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
  }

  const handleEditTrip = (trip: Trip) => {
    setSelectedTripForEdit(trip.id)
    setIsEditTripModalOpen(true)
  }

  const handleDeleteTrip = (trip: Trip) => {
    setSelectedTripForDelete(trip)
    setIsDeleteTripModalOpen(true)
  }

  const handleEditPilgrim = (pilgrim: TripRegistration) => {
    setSelectedPilgrimForEdit(pilgrim.id)
    setIsEditPilgrimModalOpen(true)
  }

  const handleDeletePilgrim = (pilgrim: TripRegistration) => {
    setSelectedPilgrimForDelete(pilgrim)
    setIsDeletePilgrimModalOpen(true)
  }

  const handleSelectPilgrim = (pilgrimId: string) => {
    setSelectedPilgrimIds((prev) =>
      prev.includes(pilgrimId)
        ? prev.filter((id) => id !== pilgrimId)
        : [...prev, pilgrimId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPilgrimIds.length === pilgrims.length) {
      setSelectedPilgrimIds([])
    } else {
      setSelectedPilgrimIds(pilgrims.map((p) => p.id))
    }
  }

  const handleSaveSuccess = () => {
    refetchTrips()
    refetchPilgrims()
  }

  const isLoading = tripsLoading || (activeTab === 'pilgrims' && pilgrimsLoading)

  return (
    <div className="p-8 animate-page-enter">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Umrah &amp; Hajj</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Manage trips and pilgrim registrations</p>
          </div>
          {activeTab === 'trips' && (
            <button
              onClick={() => setIsCreateTripModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={18} />
              Create Trip
            </button>
          )}
          {activeTab === 'pilgrims' && (
            <button
              onClick={() => setIsRegisterPilgrimModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={18} />
              Register Pilgrim
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg mb-6 shadow-sm">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('trips')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'trips'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Plane size={18} />
              Trips
            </button>
            <button
              onClick={() => setActiveTab('pilgrims')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'pilgrims'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users size={18} />
              Pilgrims
            </button>
          </div>
        </div>

        {/* Trips Tab Content */}
        {activeTab === 'trips' && (
          <div>
            {isLoading ? (
              <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
                <div className="text-slate-600 dark:text-slate-400">Loading trips...</div>
              </div>
            ) : trips.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
                <Plane className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Trips Found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No trips have been created yet.</p>
                <button
                  onClick={() => setIsCreateTripModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={18} />
                  Create First Trip
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{trip.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            trip.status as any
                          )}`}
                        >
                          {trip.status || 'Open'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                        <Calendar size={16} />
                        <span className="text-sm">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-4">
                        <DollarSign size={16} />
                        <span className="text-sm font-semibold">
                          {formatCurrency(trip.price)} per person
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => handleEditTrip(trip)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pilgrims Tab */}
        {activeTab === 'pilgrims' && (
          <div>
            {/* Trip Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Trip
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full sm:w-96 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a trip...</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name} - {formatDate(trip.start_date)}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilgrims Table */}
            {selectedTripId ? (
              isLoading ? (
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
                  <div className="text-slate-600 dark:text-slate-400">Loading pilgrims...</div>
                </div>
              ) : pilgrims.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
                  <Users className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Pilgrims Registered</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">No pilgrims have been registered for this trip yet.</p>
                  <button
                    onClick={() => setIsRegisterPilgrimModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus size={18} />
                    Register First Pilgrim
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedPilgrimIds.length === pilgrims.length}
                              onChange={handleSelectAll}
                              className="rounded"
                            />
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            Visa Status
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            Payment Status
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            Room
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {pilgrims.map((pilgrim) => (
                          <tr
                            key={pilgrim.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedPilgrimIds.includes(pilgrim.id)}
                                onChange={() => handleSelectPilgrim(pilgrim.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                {pilgrim.member?.first_name} {pilgrim.member?.last_name}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${getVisaStatusColor(
                                  pilgrim.visa_status as any
                                )}`}
                              >
                                {pilgrim.visa_status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                                  pilgrim.payment_status as any
                                )}`}
                              >
                                {pilgrim.payment_status || 'Unpaid'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                              —
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditPilgrim(pilgrim)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePilgrim(pilgrim)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
                <Plane className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Select a Trip</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Please select a trip from the dropdown above to view pilgrims.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onSave={handleSaveSuccess}
      />

      {selectedTripForEdit && (
        <EditTripModal
          isOpen={isEditTripModalOpen}
          onClose={() => {
            setIsEditTripModalOpen(false)
            setSelectedTripForEdit(null)
          }}
          onSave={handleSaveSuccess}
          tripId={selectedTripForEdit}
        />
      )}

      <DeleteTripModal
        isOpen={isDeleteTripModalOpen}
        onClose={() => {
          setIsDeleteTripModalOpen(false)
          setSelectedTripForDelete(null)
        }}
        onConfirm={() => {
          handleSaveSuccess()
          setIsDeleteTripModalOpen(false)
          setSelectedTripForDelete(null)
        }}
        tripName={selectedTripForDelete?.name || 'this trip'}
      />

      <RegisterPilgrimModal
        isOpen={isRegisterPilgrimModalOpen}
        onClose={() => setIsRegisterPilgrimModalOpen(false)}
        onSave={handleSaveSuccess}
      />

      {selectedPilgrimForEdit && (
        <EditPilgrimModal
          isOpen={isEditPilgrimModalOpen}
          onClose={() => {
            setIsEditPilgrimModalOpen(false)
            setSelectedPilgrimForEdit(null)
          }}
          onSave={handleSaveSuccess}
          pilgrimId={selectedPilgrimForEdit}
        />
      )}

      <DeletePilgrimModal
        isOpen={isDeletePilgrimModalOpen}
        onClose={() => {
          setIsDeletePilgrimModalOpen(false)
          setSelectedPilgrimForDelete(null)
        }}
        onConfirm={() => {
          handleSaveSuccess()
          setIsDeletePilgrimModalOpen(false)
          setSelectedPilgrimForDelete(null)
        }}
        pilgrimName={
          selectedPilgrimForDelete?.member
            ? `${selectedPilgrimForDelete.member.first_name} ${selectedPilgrimForDelete.member.last_name}`
            : 'this pilgrim'
        }
      />

      {selectedPilgrimForDetail && trips.find((t) => t.id === selectedTripId) && (
        <PilgrimDetailModal
          isOpen={isPilgrimDetailModalOpen}
          onClose={() => {
            setIsPilgrimDetailModalOpen(false)
            setSelectedPilgrimForDetail(null)
          }}
          pilgrim={selectedPilgrimForDetail}
          trip={trips.find((t) => t.id === selectedTripId)!}
        />
      )}

      {selectedPilgrimForVisa && (
        <UpdateVisaStatusModal
          isOpen={isUpdateVisaStatusModalOpen}
          onClose={() => {
            setIsUpdateVisaStatusModalOpen(false)
            setSelectedPilgrimForVisa(null)
          }}
          onSave={handleSaveSuccess}
          pilgrim={selectedPilgrimForVisa}
          currentStatus={selectedPilgrimForVisa.visa_status as any}
        />
      )}
    </div>
  )
}
