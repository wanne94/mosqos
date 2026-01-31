import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

interface UseOrganizationReturn {
  currentOrganizationId: string
  organizationName: string
  loading: boolean
  refresh: () => Promise<void>
}

export function useOrganization(): UseOrganizationReturn {
  const [currentOrganizationId] = useState('1') // Default organization ID
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizationName()
  }, [])

  const fetchOrganizationName = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', currentOrganizationId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization name:', error)
      }

      if (data?.name) {
        setOrganizationName(data.name)
      }
    } catch (error) {
      console.error('Error fetching organization name:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    currentOrganizationId,
    organizationName,
    loading,
    refresh: fetchOrganizationName
  }
}
