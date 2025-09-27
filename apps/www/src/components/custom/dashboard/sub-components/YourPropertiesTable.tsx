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
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Selection,
  SortDescriptor,
} from "@nextui-org/react";
import { SearchIcon } from "../icons/SearchIcon";
import { ChevronDownIcon } from "../icons/ChevronDownIcon";

// const propertyTypes = [
//   { uid: "residential", name: "Residential" },
//   { uid: "commercial", name: "Commercial" },
//   { uid: "industrial", name: "Industrial" },
//   { uid: "emptyPlot", name: "Empty Plot" },
// ];

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
          <button onClick={()=>{navigate(`/property/view/${item.id}`)}} className="px-4 py-2 font-bold text-white bg-black border-2 border-black rounded-full hover:bg-white hover:text-black">
            View
          </button>
        );
      default:
        return null;
    }
  }, []);

  return (
    <div className="w-full max-w-full px-4 mx-auto">
      <div className="flex items-center justify-between gap-4 mt-2 mb-4">
        <Dropdown>
          <DropdownTrigger>
            <Button endContent={<ChevronDownIcon />} variant="flat" className="h-12 text-md">
              Project Type
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            selectedKeys={propertyTypeFilter}
            selectionMode="multiple"
            onSelectionChange={setPropertyTypeFilter}
            closeOnSelect={false}
          >
            <DropdownItem key="all">All Types</DropdownItem>
            <DropdownItem key="residential">Residential</DropdownItem>
            <DropdownItem key="commercial">Commercial</DropdownItem>
            <DropdownItem key="industrial">Industrial</DropdownItem>
            <DropdownItem key="emptyPlot">Empty Plot</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Input
          className="w-full max-w-lg text-xl"
          placeholder="Search for a project by name..."
          startContent={<SearchIcon className="mr-2" />}
          value={filterValue}
          onValueChange={setFilterValue}
          size="lg"
        />
      </div>

      <Table aria-label="User-owned property table " className="mb-4" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.uid} allowsSorting className="text-black text-md">
              {column.name}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {sortedItems.map((item, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.uid} className="text-md">
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
