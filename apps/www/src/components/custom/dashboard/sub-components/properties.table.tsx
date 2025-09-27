import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Selection,
  SortDescriptor,
} from "@nextui-org/react";
import { SearchIcon } from "../icons/SearchIcon";
import { ChevronDownIcon } from "../icons/ChevronDownIcon";
import { Button } from "@/components/ui/button";

const columns = [
  { uid: "propertyName", name: "Project Name" },
  { uid: "location", name: "Location" },
  { uid: "propertyType", name: "Project Type" },
  { uid: "ticketPrice", name: "Ticket Price" },
  { uid: "currentPrice", name: "Current Price" },
  { uid: "totalShares", name: "Total Shares" },
  { uid: "actions", name: "Actions" },
];
interface Property {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  available_shares: number;
  propertyName: string;
  location: string;
  yourShares: number;
  latitude?: number;
  longitude?: number;
}

interface YourPropertiesTableProps {
  properties: Property[];
}

export default function YourPropertiesTable({ properties }: YourPropertiesTableProps) {
  const [portfolioProps, setPortfolioProps] = useState<Property[]>(properties);
  const [filterValue, setFilterValue] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<Selection>(new Set(["all"]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "propertyName",
    direction: "ascending",
  });
  const navigate = useNavigate();

  useEffect(() => {
    setPortfolioProps(properties);
    console.log("Properties", properties);
  }, [properties]);

  const filteredItems = useMemo(() => {
    let filtered = portfolioProps;
    if (filterValue) {
      filtered = filtered.filter((item) =>
        item.propertyName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    const propertyTypeSet = new Set(propertyTypeFilter);
    if (!propertyTypeSet.has("all")) {
      filtered = filtered.filter((item) => propertyTypeSet.has(item.type.toLowerCase()));
    }

    return filtered;
  }, [filterValue, propertyTypeFilter, portfolioProps]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let cmp = 0;
      switch (sortDescriptor.column) {
        case "propertyName":
          cmp = a.propertyName.localeCompare(b.propertyName);
          break;
        case "location":
          cmp = a.location.localeCompare(b.location);
          break;
        case "propertyType":
          cmp = a.type.localeCompare(b.type);
          break;
        case "ticketPrice":
          cmp = a.price - b.price;
          break;
        case "currentPrice":
          cmp = a.price - b.price;
          break;
        case "totalShares":
          cmp = a.available_shares - b.available_shares;
          break;
        default:
          cmp = 0;
      }
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const renderCell = useCallback((item: Property, columnKey: React.Key) => {
    switch (columnKey) {
      case "propertyName":
        return item.propertyName;
      case "location":
        return item.location;
      case "propertyType":
        return item.type;
      case "ticketPrice":
        return item.price;
      case "currentPrice":
        return item.price;
      case "totalShares":
        return item.yourShares;
      case "actions": 
        return (
          <button onClick={()=>{navigate(`/property/view/${item.id}`)}} className="px-2 py-1 md:px-4 md:py-2 min-w-20 font-bold text-white bg-black border-2 border-black rounded-full hover:bg-white hover:text-black">
            View
          </button>
        );
      default:
        return null;
    }
  }, [navigate]);

  return (
    <div className="w-full max-w-full px-4 mx-auto">
      <div className="flex items-center justify-between gap-4 mt-2 mb-4">
        <Dropdown>
          <DropdownTrigger>
            <Button variant={"outline"} className="text-base">
              Project Type
              <ChevronDownIcon />
            </Button>
          </DropdownTrigger>
          {/* @ts-expect-error NextUI DropdownMenu type compatibility issue */}
          <DropdownMenu
            disallowEmptySelection
            selectedKeys={propertyTypeFilter}
            selectionMode="multiple"
            onSelectionChange={setPropertyTypeFilter}
            closeOnSelect={false}
            className="bg-background min-w-52 border border-border rounded-md"
          >
            <DropdownItem key="all">All Types</DropdownItem>
            <DropdownItem key="residential">Residential</DropdownItem>
            <DropdownItem key="commercial">Commercial</DropdownItem>
            <DropdownItem key="industrial">Industrial</DropdownItem>
            <DropdownItem key="emptyPlot">Empty Plot</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Input
          className="w-full max-w-lg text-base bg-gray-100 rounded-xl"
          placeholder="Search for a project by name..."
          startContent={<SearchIcon className="mr-1" />}
          value={filterValue}
          onValueChange={setFilterValue}
          size="lg"
        />
      </div>

      <Table
        isStriped
        aria-label="User-owned property table"
        className="w-full md:w-full overflow-x-scroll border rounded-2xl mb-4"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              allowsSorting
              align={column.uid === "actions" ? "center" : "start"}
              className="text-base"
            >
              <div className="flex gap-2 items-center group">{column.name}</div>
            </TableColumn>
          )}
        </TableHeader>
        <TableBody>
          {sortedItems.map((item, index) => (
            <TableRow key={index} className={`${index % 2 !== 0 ? "bg-gray-100" : ""}`}>
              {columns.map((column) => (
                <TableCell key={column.uid} className="text-base">
                  {renderCell(item, column.uid)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
