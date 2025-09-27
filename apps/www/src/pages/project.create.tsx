// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from "react-hook-form"
// import { z } from "zod"
// import { useState } from "react"
// import { ImageUpload } from "@/components/custom/image.upload"
// import { Button } from "@/components/ui/button"
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Separator } from "@/components/ui/separator"

// const propertyCreateSchema = z.object({
//   name: z.string().min(1, "Property name is required"),
//   status: z.enum(["launchpad", "trading"]),
//   price: z.coerce.number().positive("Price must be positive"),
//   availableShares: z.coerce.number().int().positive("Available shares must be positive"),
//   location: z.string().min(1, "Location is required"),
//   type: z.string().min(1, "Property type is required"),
//   image: z.string().min(1, "Property image is required"),
//   attributes: z.object({
//     sharePerNFT: z.coerce.number().positive("Share per NFT must be positive"),
//     propertyType: z.string().min(1, "Property type is required"),
//     initialSharePrice: z.coerce.number().positive("Initial share price must be positive"),
//     initialPropertyValue: z.coerce.number().positive("Initial property value must be positive"),
//   }),
//   growth: z.string(),
//   description: z.string().min(10, "Description must be at least 10 characters"),
// })

// type PropertyFormValues = z.infer<typeof propertyCreateSchema>

// export default function CreatePropertyPage() {
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const form = useForm<PropertyFormValues>({
//     resolver: zodResolver(propertyCreateSchema),
//     defaultValues: {
//       name: "",
//       status: "launchpad",
//       price: 0,
//       availableShares: 0,
//       location: "",
//       type: "",
//       image: "",
//       attributes: {
//         sharePerNFT: 0,
//         propertyType: "",
//         initialSharePrice: 0,
//         initialPropertyValue: 0,
//       },
//       growth: "",
//       description: "",
//     },
//   })

//   async function onSubmit(data: PropertyFormValues) {
//     setIsSubmitting(true)
//     try {
//       console.log(data)
//       // Here you would typically send the data to your API
//       // await createProperty(data)
//       alert("Property created successfully!")
//       form.reset()
//     } catch (error) {
//       console.error("Error creating property:", error)
//       alert("Failed to create property. Please try again.")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <div className="container mx-auto pb-10 pt-5">
//       <Card className="border border-gray-200 bg-white">
//         <CardHeader className="border-b border-gray-100">
//           <CardTitle className="text-2xl font-bold">Create New Property</CardTitle>
//           <CardDescription>Fill in the details below to create a new property listing.</CardDescription>
//         </CardHeader>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)}>
//             <CardContent className="space-y-8 pt-6">
//               {/* Basic Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Basic Information</h3>
//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="name"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Property Name</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Enter property name" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="status"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Status</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select status" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="launchpad">Launchpad</SelectItem>
//                             <SelectItem value="trading">Trading</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Price</FormLabel>
//                         <FormControl>
//                           <Input type="number" placeholder="0.00" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="availableShares"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Available Shares</FormLabel>
//                         <FormControl>
//                           <Input type="number" placeholder="0" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="location"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Location</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Enter property location" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="type"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Property Type</FormLabel>
//                         <FormControl>
//                           <Input placeholder="e.g. Residential, Commercial" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </div>

//               <Separator className="my-4" />

//               {/* Property Image */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Property Image</h3>
//                 <FormField
//                   control={form.control}
//                   name="image"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Property Image</FormLabel>
//                       <FormControl>
//                         <ImageUpload value={field.value} onChange={field.onChange} />
//                       </FormControl>
//                       <FormDescription>Upload a high-quality image of the property.</FormDescription>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>

//               <Separator className="my-4" />

//               {/* Property Attributes */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Property Attributes</h3>
//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="attributes.sharePerNFT"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Share Per NFT</FormLabel>
//                         <FormControl>
//                           <Input type="number" placeholder="0" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="attributes.propertyType"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Property Type (Detailed)</FormLabel>
//                         <FormControl>
//                           <Input placeholder="e.g. Apartment, Villa, Office" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-2">
//                   <FormField
//                     control={form.control}
//                     name="attributes.initialSharePrice"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Initial Share Price</FormLabel>
//                         <FormControl>
//                           <Input type="number" placeholder="0.00" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                   <FormField
//                     control={form.control}
//                     name="attributes.initialPropertyValue"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Initial Property Value</FormLabel>
//                         <FormControl>
//                           <Input type="number" placeholder="0.00" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </div>

//               <Separator className="my-4" />

//               {/* Additional Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Additional Information</h3>
//                 <FormField
//                   control={form.control}
//                   name="growth"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Growth Potential</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Describe growth potential" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Description</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Provide a detailed description of the property"
//                           className="min-h-[120px]"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             </CardContent>
//             <CardFooter className="flex justify-end space-x-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
//               <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSubmitting}>
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isSubmitting}>
//                 {isSubmitting ? "Creating..." : "Create Property"}
//               </Button>
//             </CardFooter>
//           </form>
//         </Form>
//       </Card>
//     </div>
//   )
// }
