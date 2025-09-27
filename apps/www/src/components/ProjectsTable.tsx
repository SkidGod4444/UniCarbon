import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell
} from "@nextui-org/react";
import usdcCoin from "../assets/svg/usd-coin.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowTrendDown, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    Input,
    Selection,
    SortDescriptor
} from "@nextui-org/react";
import { ChevronDownIcon } from "./custom/dashboard/icons/ChevronDownIcon";
import { SearchIcon } from "./custom/dashboard/icons/SearchIcon";
import { ChevronUpIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Project } from "index";

const columns = [
    { uid: "cover", name: "" },
    { uid: "name", name: "Project Name" },
    { uid: "type", name: "Project Type" },
    { uid: "status", name: "Status" },
    { uid: "price", name: "Current Price" },
    { uid: "growth", name: "Growth" },
    { uid: "available_shares", name: "Available Shares" },
    { uid: "actions", name: "Actions" },
];

const priceFilters = ["Low to High", "High to Low"];

export const ProjectsTable = () => {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [projectTypes, setProjectTypes] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<Selection>(new Set(["all"]));
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "name",
        direction: "ascending",
    });
    const [selectedPrice, setSelectedPrice] = useState<string>("Price");

    const filteredProjects = useMemo(() => {
        let filtered = [...projects];

        // Filter by selected types
        const typesSet = selectedTypes as Set<string>;
        if (!typesSet.has("all")) {
            filtered = filtered.filter(project =>
                Array.from(selectedTypes).includes(project.type)
            );
        }
        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(project =>
                project.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        // Sort by price
        if (selectedPrice === "Low to High") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (selectedPrice === "High to Low") {
            filtered.sort((a, b) => b.price - a.price);
        }
        return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects, selectedTypes, searchQuery]);

    const sortedProjects = useMemo(() => {
        return [...filteredProjects].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Project] ?? '';
            const second = b[sortDescriptor.column as keyof Project] ?? '';
            const cmp = (first < second ? -1 : 1) * (sortDescriptor.direction === "descending" ? -1 : 1);
            return cmp;
        });
    }, [filteredProjects, sortDescriptor]);
    
    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('property_data').select();
            if (error) {
                alert("error");
                setProjects([]);
            }
            if (data) {
                setProjects(data);
                const types = Array.from(new Set(data.map(project => project.type)));
                setProjectTypes(types);
            }
            setLoading(false);
        };

        fetchProjects();
    }, []);

    if (loading) {  
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex flex-col items-center justify-between gap-4 mt-8 mb-6 md:flex-row">
                <div className="flex flex-wrap gap-4">
                    {/* Property Type Filter */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button endContent={<ChevronDownIcon />} variant="flat" className="h-12 text-base">
                                Project Type
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            selectionMode="multiple"
                            selectedKeys={selectedTypes}
                            onSelectionChange={setSelectedTypes}
                            closeOnSelect={false}
                        >
                            <DropdownItem key="all">All Types</DropdownItem>
                            <>
                                {projectTypes.map(type => (
                                    <DropdownItem key={type}>{type}</DropdownItem>
                                ))}
                            </>
                        </DropdownMenu>
                    </Dropdown>
                    {/* Price Filter */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button 
                                endContent={<ChevronDownIcon />} 
                                variant="flat" 
                                className="h-12 text-base"
                            >
                                {selectedPrice}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu 
                            selectionMode="single"
                            selectedKeys={new Set([selectedPrice])}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setSelectedPrice(selected);
                                setSortDescriptor({
                                    column: "price",
                                    direction: selected === "Low to High" ? "ascending" : "descending"
                                });
                            }}
                        >
                            {priceFilters.map((price) => (
                                <DropdownItem key={price}>
                                    {price}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                {/* Search Input */}
                <Input
                    className="w-full max-w-lg text-base bg-gray-100 rounded-xl"
                    placeholder="Search for a property by name"
                    startContent={<SearchIcon className="mr-1" />}
                    size="lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Table
                isStriped
                aria-label="Example static collection table"
                className="w-full md:w-full overflow-x-scroll border rounded-2xl"
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            allowsSorting
                            align={column.uid === "actions" ? "center" : "start"}
                            className="text-black text-base"
                        >
                            <div className="flex gap-2 items-center group">{column.name} <span className="opacity-0 ease-in-out transition-opacity duration-300 group-hover:opacity-100"><ChevronUpIcon /></span></div>
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody>
                    {sortedProjects.map((project:Project, index:number) => (
                        <TableRow key={index} className={`${index % 2 !== 0 ? "bg-gray-100" : ""}`}>
                            <TableCell>
                                <img
                                    src={project.image}
                                    alt={project.name}
                                    className="min-w-12 md:w-12 h-12 rounded-xl object-cover"
                                />
                            </TableCell>
                            <TableCell>
                                <div className="text-base font-semibold">{project.name}</div>
                                <div className="text-gray-500 text-sm">{project.location}</div>
                            </TableCell>
                            <TableCell className="text-base">{project.type}</TableCell>
                            <TableCell className="text-base">{project.status}</TableCell>
                            <TableCell className="text-base font-semibold">
                                <div className="flex flex-row items-center gap-x-2">
                                    <img src={usdcCoin} alt="SOL" className="w-6 h-6" />
                                    ${project.price.toFixed(2)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <p className="flex flex-row items-center gap-2 text-base">
                                    <FontAwesomeIcon icon={parseInt(project.growth) > 0 ? faArrowTrendUp : faArrowTrendDown} color={parseInt(project.growth) > 0 ? "green" : "red"} />
                                    &nbsp;{project.growth}
                                </p>
                            </TableCell>
                            <TableCell className="text-base">{project.available_shares}</TableCell>
                            <TableCell>
                                
                                <button onClick={()=>{navigate(`/property/view/${project.id}`)}} className="px-2 py-1 md:px-4 md:py-2 min-w-20 font-bold text-white bg-black border-2 border-black rounded-full hover:bg-white hover:text-black">
                                    View & Buy
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};