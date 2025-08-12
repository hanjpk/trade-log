import { TradeForm } from "@/components/trade-form"

export default function NewTradePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Add New Trade</h1>
      <TradeForm />
    </div>
  )
}