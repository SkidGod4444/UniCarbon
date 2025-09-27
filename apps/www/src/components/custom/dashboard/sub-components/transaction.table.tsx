import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  // Button,
  SortDescriptor,
} from "@nextui-org/react";
import { SearchIcon } from "../icons/SearchIcon";

type Transaction = {
  amount: number;
  currency: string;
  order_id: string;
  created_at: string;
  status: string;
  shares: number;
  property_name: string;
};

interface Props {
  transactions: Transaction[];
}

const columns = [
  { uid: "property_name", name: "Project Name" },
  { uid: "amount", name: "Amount" },
  { uid: "currency", name: "Currency" },
  { uid: "order_id", name: "Order ID" },
  { uid: "created_at", name: "Date" },
  { uid: "status", name: "Status" },
  { uid: "shares", name: "Shares" },
];

export default function YourTransactionTable({ transactions }: Props) {
  const [filteredTxns, setFilteredTxns] = useState<Transaction[]>(transactions);
  const [filterValue, setFilterValue] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "created_at",
    direction: "descending",
  });

  useEffect(() => {
    setFilteredTxns(transactions);
  }, [transactions]);

  const filteredItems = useMemo(() => {
    let filtered = [...filteredTxns];
    if (filterValue) {
      filtered = filtered.filter((txn) =>
        txn.property_name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    return filtered;
  }, [filterValue, filteredTxns]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let cmp = 0;
      const column = sortDescriptor.column as keyof Transaction;

      if (column === "amount" || column === "shares") {
        cmp = (a[column] as number) - (b[column] as number);
      } else {
        cmp = String(a[column]).localeCompare(String(b[column]));
      }

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  const renderCell = (txn: Transaction, columnKey: React.Key) => {
    const key = columnKey as keyof Transaction;
    if (key === "created_at") {
      return new Date(txn.created_at).toLocaleDateString();
    }
    if (key === "amount") {
      return `${(txn.amount / 85.53).toFixed(2)}`;
    }
    if (key === "currency") {
      return "USD";
    }
    return txn[key];
  };

  return (
    <div className="w-full max-w-full px-4 mx-auto">
      <div className="flex items-center justify-between gap-4 mt-2 mb-4">
        <Input
          className="w-full max-w-lg text-xl"
          placeholder="Search by project name..."
          startContent={<SearchIcon className="mr-2" />}
          value={filterValue}
          onValueChange={setFilterValue}
          size="lg"
        />
      </div>

      <Table
        aria-label="Transaction history table"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        className="mb-4"
      >
        <TableHeader>
          {columns.map((col) => (
            <TableColumn
              key={col.uid}
              allowsSorting
              className="text-black text-md"
            >
              {col.name}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {sortedItems.map((txn, index) => (
            <TableRow key={index}>
              {columns.map((col) => (
                <TableCell key={col.uid} className="text-md">
                  {renderCell(txn, col.uid)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
