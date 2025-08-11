"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

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

// Custom hook to fetch trades from the API
function useTrades() {
    const [trades, setTrades] = React.useState<Trade[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        async function fetchTrades() {
            try {
                setLoading(true)
                const response = await fetch('/api/trades')
                if (!response.ok) {
                    throw new Error('Failed to fetch trades')
                }
                const data = await response.json()
                setTrades(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchTrades()
    }, [])

    return { trades, loading, error }
}

function TradeLogDataTable() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const router = useRouter()

    // Fetch trades from database
    const { trades, loading, error } = useTrades()

    const columns: ColumnDef<Trade>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "cryptoName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Asset
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="font-medium">{row.getValue("cryptoName")}</div>,
        },
        {
            accessorKey: "outcome",
            header: "Outcome",
            cell: ({ row }) => {
                const outcome = row.getValue("outcome") as string
                const variant =
                    outcome === "Profit"
                        ? "default"
                        : outcome === "Loss"
                            ? "destructive"
                            : "secondary"
                return (
                    <Badge variant={variant} className="capitalize">
                        {outcome}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "pnl",
            header: ({ column }) => (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        P/L (Rp)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const pnl = parseFloat(row.getValue("pnl"))
                const formatted = new Intl.NumberFormat("en-ID", {
                    style: "currency",
                    currency: "IDR",
                }).format(pnl)

                // Apply color based on profit or loss
                const textColorClass = pnl >= 0 ? "text-green-500" : "text-red-500"

                return <div className={`text-right font-bold ${textColorClass}`}>{formatted}</div>
            },
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => <div>{row.getValue("reason")}</div>,
        },
        {
            accessorKey: "notes",
            header: "Notes",
            cell: ({ row }) => {
                const notes = row.getValue("notes") as string;
                // Truncate long notes for better layout and show full note on hover
                return (
                    <div className="max-w-[250px] truncate" title={notes || ""}>
                        {notes || "No notes"}
                    </div>
                )
            },
        },
        {
            accessorKey: "entryPrice",
            header: () => <div className="text-right">Entry Price</div>,
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("entryPrice"))
                const formatted = new Intl.NumberFormat("en-ID", {
                    style: "currency",
                    currency: "IDR",
                }).format(amount)
                return <div className="text-right font-medium">{formatted}</div>
            },
        },
        {
            accessorKey: "exitPrice",
            header: () => <div className="text-right">Exit Price</div>,
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("exitPrice"))
                if (isNaN(amount)) return <div className="text-right text-muted-foreground">Open</div>
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount)
                return <div className="text-right font-medium">{formatted}</div>
            },
        },
        {
            accessorKey: "entryDate",
            header: "Entry Date",
            cell: ({ row }) => (
                <div>
                    {new Date(row.getValue("entryDate")).toLocaleDateString("en-US", {
                        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    })}
                </div>
            ),
        },
        {
            accessorKey: "exitDate",
            header: "Exit Date",
            cell: ({ row }) => {
                const exitDate = row.getValue("exitDate") as string | null
                if (!exitDate) return <div className="text-muted-foreground">Open</div>
                return (
                    <div>
                        {new Date(exitDate).toLocaleDateString("en-US", {
                            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                        })}
                    </div>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const trade = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => router.push(`/trades/${trade.id}`)}
                            >
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Edit Trade</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete Trade</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
            enableSorting: false,
            enableHiding: false,
        },
    ]

    const table = useReactTable({
        data: trades,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    // Show loading state
    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading trades...</p>
                </div>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="text-center">
                    <p className="text-red-500">Error loading trades: {error}</p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="mt-2"
                        variant="outline"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex items-center py-4 gap-2">
                <Input
                    placeholder="Filter by crypto..."
                    value={(table.getColumn("cryptoName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("cryptoName")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => router.push('/trades/new')}>Tambah Data</Button>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No trades found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

export { TradeLogDataTable }