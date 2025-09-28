import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateRetirementCertificate } from "@/utils/pdfGenerator";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import axios from "axios";

// Update Project interface to match the database structure
interface Project {
  id: number;
  created_at: string;
  user_id: string;
  property_id: string;
  credits: number;
  name?: string; // This will store the project name from property_data
}

// Update Purchase interface to match the offset table structure
interface Purchase {
  id: string;
  user_id: string;
  property_id: string;
  credits: number;
  description: string;
  transaction_hash: string;
  beneficiary_address: string;
  beneficiary_name: string;
  created_at: Date;
}

// Form schema
const formSchema = z.object({
  projectId: z.string({ required_error: "Please select a project." }),
  credits: z.coerce
    .number({
      required_error: "Please enter the number of credits.",
      invalid_type_error: "Credits must be a number.",
    })
    .positive("Credits must be positive."),
  description: z.string().min(5, "Description must be at least 5 characters.").max(100, "Description must be at most 100 characters."),
  address: z
    .string()
    .min(42, "Address is not valid.")
    .max(42, "Address is not valid."),
  beneficiaryName: z.string().min(1, "Beneficiary name is required"),
});

export default function CreditPurchasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "" },
  });

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error.message);
          return;
        }

        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    getCurrentUser();
  }, []);

  // Fetch projects with property names
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUserId) return;

      setLoading(true);
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from("owners")
          .select("*")
          .eq("user_id", currentUserId);

        if (projectsError) throw projectsError;

        // Fetch property names for each project
        const projectsWithNames = await Promise.all(
          projectsData.map(async (project) => {
            const { data: propertyData, error: propertyError } = await supabase
              .from("property_data")
              .select("name")
              .eq("id", project.property_id)
              .single();

            if (propertyError) throw propertyError;

            return {
              ...project,
              name: propertyData.name,
            };
          })
        );

        setProjects(projectsWithNames);
      } catch (error) {
        toast.error("Failed to fetch projects");
        throw new Error(`Failed to fetch projects: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUserId]);

  // Add this effect to fetch purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      if (!currentUserId) return;

      try {
        const { data, error } = await supabase
          .from("offset")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          console.log(data, "data")
          setPurchases(data);
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
        toast.error("Failed to fetch purchases");
      }
    };

    fetchPurchases();
  }, [currentUserId]);

  const selectedProjectId = form.watch("projectId");
  const selectedProject = projects.find((p) => {
    return p.property_id.toString() === selectedProjectId;
  });

  const validateCredits = (value: number) => {
    if (!selectedProject) return true;
    return (
      value <= selectedProject.credits ||
      `Credits must be less than or equal to ${selectedProject.credits}`
    );
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUserId || !selectedProject) {
      toast.error("Please login or select a project");
      return;
    }

    if (values.credits > selectedProject.credits) {
      toast.error("Insufficient credits available");
      return;
    }

    setLoading(true);
    try {
      toast.loading("Retiring credits in progress...", {
        description: "Please wait while we retire your credits can take a while to complete",
        id: "retire-credits",
      });

      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/v1/contracts/offset`, {
        userId: currentUserId,
        propertyId: selectedProjectId,
        credits: values.credits,
        description: values.description,
        beneficiaryAddress: values.address,
        beneficiaryName: values.beneficiaryName,
      });

      if (!data.success) {
        toast.error("Failed to retire credits", {
          id: "retire-credits",
        });
        return;
      } else {
        // Trigger re-fetch of purchases
        const { data: newPurchases, error } = await supabase
          .from("offset")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false });

        if (!error && newPurchases) {
          setPurchases(newPurchases);
        }

        // Refetch projects data
        const { data: projectsData, error: projectsError } = await supabase
          .from("owners")
          .select("*")
          .eq("user_id", currentUserId);

        if (projectsError) throw projectsError;

        // Fetch property names for each project
        const projectsWithNames = await Promise.all(
          projectsData.map(async (project) => {
            const { data: propertyData, error: propertyError } = await supabase
              .from("property_data")
              .select("name")
              .eq("id", project.property_id)
              .single();

            if (propertyError) throw propertyError;

            return {
              ...project,
              name: propertyData.name,
            };
          })
        );

        setProjects(projectsWithNames);

        generateRetirementCertificate({
          retiredOn: format(new Date(), "dd MMM yyyy"),
          tonnes: String(data.data?.credits),
          beneficiary: data.data?.beneficiary_name,
          beneficiaryAddress: data.data?.beneficiary_address,
          project: selectedProject.name || "",
          transactionHash: data.data?.transaction_hash,
          description: data.data?.description,
        });

        form.reset();
        toast.success("Credits retired successfully", {
          id: "retire-credits",
        });
      }
    } catch (error) {
      toast.error(
        "Transaction failed. Please contact support if you see inconsistent state.", {
        id: "retire-credits",
      });
      throw new Error(`Transaction failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 md:px-4">
      <Card className="mb-8 w-full">
        <CardHeader>
          <CardTitle>Retire Credits</CardTitle>
          <CardDescription>
            Select a project and specify the number of credits you want to
            purchase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem
                              key={project.property_id}
                              value={project.property_id.toString()}
                            >
                              {project.name} ({project.credits} credits
                              available)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Select the project you want to Retire credits for.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credits"
                  rules={{
                    validate: validateCredits,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Credits</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {selectedProject
                          ? `Enter a number less than or equal to ${selectedProject.credits}.`
                          : "Select a project first."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Provide a brief description for this purchase.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiaryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter the name of the beneficiary
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className={`w-full ${loading ? "bg-primary/70" : "bg-primary"}`}
                disabled={loading}
              >
                Retire Credits
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {purchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Retired Credits</CardTitle>
            <CardDescription>
              Your recent credit retirements are listed below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchases.map((purchase, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="font-medium">Project:</div>
                    <div className="break-words">
                      {purchase.beneficiary_name}
                    </div>

                    <div className="font-medium">Credits:</div>
                    <div className="break-words">{purchase.credits}</div>

                    <div className="font-medium">Address:</div>
                    <div className="break-words">
                      {purchase.beneficiary_address}
                    </div>

                    <div className="font-medium">Transaction Hash:</div>
                    <div className="break-words hover:text-blue-500">
                      <a
                        href={`https://amoy.polygonscan.com/tx/${purchase.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {purchase.transaction_hash}
                      </a>
                    </div>

                    <div className="font-medium">Description:</div>
                    <div className="break-words">{purchase.description}</div>

                    <div className="font-medium">Date:</div>
                    <div className="break-words">
                      {purchase.created_at.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      generateRetirementCertificate({
                        retiredOn: format(
                          purchase.created_at,
                          "dd MMM yyyy"
                        ).toString(),
                        tonnes: (purchase.credits / 1).toString(),
                        beneficiaryAddress: purchase.beneficiary_address,
                        beneficiary: purchase.beneficiary_name,
                        project: purchase.beneficiary_name,
                        transactionHash: purchase.transaction_hash,
                        description: purchase.description,
                      })
                    }
                  >
                    Download Receipt
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
