"use client"

import { notFound, useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    ClipboardList,
    DollarSign,
    FileText,
    Hash,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"

// Updated Trade type to match database schema
export type Trade = {
    id: string
    cryptoName: string
    entryDate: string
    exitDate: string | null
    entryPrice: number
    exitPrice: number | null
    positionSize: number
    pnl: number
    outcome: "Profit" | "Loss" | "Breakeven"
    reason: string
    notes: string | null
    userId: string
    createdAt: string
    updatedAt: string
}

// --- Page Component ---

export default function TradeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [trade, setTrade] = useState<Trade | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        async function fetchTrade() {
            try {
                setLoading(true)
                const response = await fetch(`/api/trades/${id}`)
                
                if (!response.ok) {
                    if (response.status === 404) {
                        notFound()
                        return
                    }
                    throw new Error('Failed to fetch trade')
                }
                
                const data = await response.json()
                setTrade(data)
            } catch (err) {
                console.error('Error fetching trade:', err)
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchTrade()
    }, [id])

    // Show loading state
    if (loading) {
        return (
            <main className="container mx-auto max-w-4xl py-12">
                <BackButton />
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Loading trade details...</p>
                    </div>
                </div>
            </main>
        )
    }

    // Show error state
    if (error) {
        return (
            <main className="container mx-auto max-w-4xl py-12">
                <BackButton />
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <p className="text-red-500">Error loading trade: {error}</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="mt-2"
                            variant="outline"
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            </main>
        )
    }

    // If trade is not found, this should have been handled by notFound()
    if (!trade) {
        return null
    }

    // --- UI Logic and Formatting ---
    const isProfit = trade.outcome === "Profit"
    const isLoss = trade.outcome === "Loss"

    const outcomeVariant = isProfit
        ? "default"
        : isLoss
            ? "destructive"
            : "secondary"

    const pnlColorClass = isProfit
        ? "text-green-500"
        : isLoss
            ? "text-red-500"
            : "text-muted-foreground"

    const formatCurrency = (amount: number | null) => {
        if (amount === null || isNaN(amount)) return "N/A"
        return new Intl.NumberFormat("en-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatPnl = (amount: number) => {
        return new Intl.NumberFormat("en-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Position is still open"
        return new Date(dateString).toLocaleString("en-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <main className="container mx-auto max-w-4xl py-12">
            <BackButton/>
            <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-start bg-muted/50">
                    <div className="grid gap-0.5">
                        <CardTitle className="group flex items-center gap-2 text-2xl">
                            {trade.cryptoName} Trade Details
                            <Badge variant={outcomeVariant}>{trade.outcome}</Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Trade ID: {trade.id}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6 text-sm">
                    {/* P/L Section */}
                    <div className="grid gap-3">
                        <div className="font-semibold text-xl">Profit & Loss</div>
                        <div className="flex items-center gap-4">
                            <div className={`text-4xl font-bold ${pnlColorClass}`}>
                                {formatPnl(trade.pnl)}
                            </div>
                            {isProfit && <ArrowUpRight className={`h-8 w-8 ${pnlColorClass}`} />}
                            {isLoss && <ArrowDownLeft className={`h-8 w-8 ${pnlColorClass}`} />}
                        </div>
                    </div>
                    <Separator className="my-6" />

                    {/* Core Details Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-3">
                            <div className="font-semibold">Price Details</div>
                            <ul className="grid gap-3">
                                <li className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Entry Price
                                    </span>
                                    <span>{formatCurrency(trade.entryPrice)}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Exit Price
                                    </span>
                                    <span>{formatCurrency(trade.exitPrice)}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Position Size
                                    </span>
                                    <span>{trade.positionSize}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="grid auto-rows-max gap-3">
                            <div className="font-semibold">Timeline</div>
                            <ul className="grid gap-3">
                                <li className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Entry Date
                                    </span>
                                    <span>{formatDate(trade.entryDate)}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Exit Date
                                    </span>
                                    <span>{formatDate(trade.exitDate)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <Separator className="my-6" />

                    {/* Reason & Notes */}
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <div className="font-semibold">Rationale</div>
                            <dl className="grid gap-3">
                                <div className="flex items-start gap-3">
                                    <dt className="text-muted-foreground"><ClipboardList className="h-5 w-5" /></dt>
                                    <dd>
                                        <p className="font-medium leading-relaxed">{trade.reason}</p>
                                    </dd>
                                </div>
                                <div className="flex items-start gap-3">
                                    <dt className="text-muted-foreground"><FileText className="h-5 w-5" /></dt>
                                    <dd className="leading-relaxed">{trade.notes || "No notes provided"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}