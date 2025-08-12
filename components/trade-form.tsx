"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// UI Components
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { useCryptoList } from "@/lib/hooks/use-crypto-list"

// The Trade type compatible with database schema
export type Trade = {
  cryptoName: string
  entryDate: string
  exitDate: string | null
  entryPrice: number
  exitPrice: number | null
  positionSize: number
  pnl: number
  outcome: "Profit" | "Loss" | "Breakeven"
  reason: string
  notes: string
}

// 1. Define the Zod schema for form validation.
// This schema only includes fields that the user will input.
const formSchema = z.object({
  cryptoId: z.string().min(1, "Please select a cryptocurrency."),
  entryDate: z.date(),
  exitDate: z.date().optional(),
  entryPrice: z.string().min(1, "Entry price is required."),
  exitPrice: z.string().optional(),
  positionSize: z.string().min(1, "Position size is required."),
  reason: z.string().min(1, "Reason for trade is required."),
  notes: z.string().default(""),
})

type FormData = z.infer<typeof formSchema>

export function TradeForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { cryptoOptions, loading: cryptoLoading, error: cryptoError } = useCryptoList()
  
  // 2. Define the form using react-hook-form and the Zod schema.
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cryptoId: "",
      entryPrice: "",
      positionSize: "",
      reason: "",
      notes: "",
    },
  })

  // 3. Define the submit handler.
  async function onSubmit(values: FormData) {
    setIsSubmitting(true)
    try {
      // Convert string values to numbers
      const entryPrice = parseFloat(values.entryPrice)
      const exitPrice = values.exitPrice ? parseFloat(values.exitPrice) : null
      const positionSize = parseFloat(values.positionSize)

      // Calculate PnL and Outcome
      const pnl =
        exitPrice && entryPrice
          ? (exitPrice - entryPrice) * positionSize
          : 0
      const outcome = pnl > 0 ? "Profit" : pnl < 0 ? "Loss" : "Breakeven"

      // Find the selected crypto to get its name
      const selectedCrypto = cryptoOptions.find(crypto => crypto.value === values.cryptoId)
      if (!selectedCrypto) {
        throw new Error('Selected cryptocurrency not found')
      }

      // Construct the final Trade object
      const newTrade: Trade = {
        cryptoName: selectedCrypto.label,
        entryDate: values.entryDate.toISOString(),
        exitDate: values.exitDate ? values.exitDate.toISOString() : null,
        entryPrice,
        exitPrice,
        positionSize,
        pnl,
        outcome,
        reason: values.reason,
        notes: values.notes,
      }

      // Send the trade to the API
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTrade),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create trade')
      }

      const createdTrade = await response.json()
      toast.success('Trade created successfully!')
      form.reset()
      router.push('/')
    } catch (error) {
      console.error('Error creating trade:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create trade')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Crypto Selection */}
        <FormField
          control={form.control}
          name="cryptoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cryptocurrency *</FormLabel>
              <FormControl>
                <Combobox
                  options={cryptoOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a cryptocurrency..."
                  searchPlaceholder="Search cryptocurrencies..."
                  emptyText="No cryptocurrencies found."
                  disabled={cryptoLoading || isSubmitting}
                />
              </FormControl>
              {cryptoError && (
                <p className="text-sm text-destructive">
                  Error loading cryptocurrencies: {cryptoError}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Entry and Exit Details in a Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Entry Date */}
          <FormField
            control={form.control}
            name="entryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Entry Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Exit Date (Optional) */}
          <FormField
            control={form.control}
            name="exitDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Exit Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Entry Price */}
          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Price (Rp)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any" 
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Exit Price (Optional) */}
          <FormField
            control={form.control}
            name="exitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exit Price ($) (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any" 
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Position Size */}
        <FormField
          control={form.control}
          name="positionSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position Size</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any" 
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                The quantity of the crypto you traded.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reason for Trade */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Trade *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Bullish divergence on RSI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional thoughts or details about the trade..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Trade..." : "Add Trade"}
        </Button>
      </form>
    </Form>
  )
}
