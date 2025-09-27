import { z } from "zod";

const offsetSchema = z.object({
  userId: z.string({
    message: "Please provide a valid user id",
  }),
  propertyId: z.string({
    message: "Please provide a valid property id",
  }),
  credits: z.number({
    message: "Number of credits must be a valid integer",
  }),
  description: z.string({
    message: "Order currency must be a valid string",
  }),
  beneficiaryAddress: z.string({
    message: "Beneficiary address must be a valid string",
  }),
  beneficiaryName: z.string({
    message: "Beneficiary name must be a valid string",
  }),
});

const orderCreateSchema = z.object({
  userId: z.string({
    message: "Please provide a valid user id",
  }),
  propertyId: z.string({
    message: "Please provide a valid property id",
  }),
  shares: z.number({
    message: "Number of shares must be a valid integer",
  }),
  currency: z.string().optional().default("INR"),
});

const orderVerifySchema = z.object({
  orderId: z.string({
    message: "Please provide a valid order id",
  }),
  propertyId: z.string({
    message: "Please provide a valid property id",
  }),
  shares: z.number({
    message: "Number of shares must be a valid integer",
  }),
  userId: z.string({
    message: "Please provide a valid user id",
  }),
});

const propertyCreateSchema = z.object({
  name: z.string({
    message: "Please provide a valid property name",
  }),
  status: z.string({
    message: "Please provide a valid status",
  }),
  price: z.number({
    message: "Please provide a valid price",
  }),
  availableShares: z.number({
    message: "Please provide a valid number of available shares",
  }),
  location: z.string({
    message: "Please provide a valid location",
  }),
  type: z.string({
    message: "Please provide a valid property type",
  }),
  image: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  valueParameters: z.record(z.any()).optional(),
  updates: z.array(z.any()).optional(),
  growth: z.number().optional(),
  description: z.string().optional(),
});

const deletePropertySchema = z.object({
  id: z.string({
    message: "Please provide a valid property id",
  }),
});

export { 
  orderCreateSchema, 
  orderVerifySchema, 
  offsetSchema, 
  propertyCreateSchema, 
  deletePropertySchema 
};
