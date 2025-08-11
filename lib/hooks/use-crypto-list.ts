import { useState, useEffect } from 'react'
import { ComboboxOption } from '@/components/ui/combobox'
import cryptoListData from '@/lib/data/crypto-list.json'

interface CoinGeckoCoin {
  id: string
  symbol: string
  name: string
}

export function useCryptoList() {
  const [cryptoOptions, setCryptoOptions] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function loadCryptoList() {
      try {
        setLoading(true)
        setError(null)
        
        // Use the local JSON data
        const data: CoinGeckoCoin[] = cryptoListData
        
        // Convert to ComboboxOption format and sort by name
        const options: ComboboxOption[] = data
          .map(coin => ({
            value: coin.id,
            label: coin.name,
            symbol: coin.symbol.toUpperCase(),
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
        
        setCryptoOptions(options)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load crypto list')
        console.error('Error loading crypto list:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCryptoList()
  }, [])

  return {
    cryptoOptions,
    loading,
    error,
  }
} 