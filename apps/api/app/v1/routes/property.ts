
import { deletePropertySchema, propertyCreateSchema } from "@/utilities/schema";
import { supabase } from "@/utilities/supabase";
import { Hono } from "hono";

const property = new Hono();

property.get("/", async (c) => {
  const { data, error } = await supabase.from("property_data").select("*");

  if (!data) {
    return c.json(
      {
        success: false,
        error,
      },
      400
    );
  }

  return c.json({
    success: true,
    data,
  });
});

property.get("/:propertyId", async (c) => {
  const propertyId = c.req.param("propertyId");

  const { data, error } = await supabase
    .from("property_data")
    .select("*")
    .eq("id", propertyId);

  if (!data) {
    return c.json(
      {
        success: false,
        error,
      },
      400
    );
  }

  if (data.length <= 0) {
    return c.json({
      success: false,
      error: "No property found with that id",
    });
  }

  return c.json({
    success: true,
    data,
  });
});

property.post("/create", async (c) => {
  const body = await c.req.json();
  const { success, data, error } = propertyCreateSchema.safeParse(body);

  if (!success) {
    return c.json({
      success: false,
      error,
    });
  }

  const { data: dbData } = await supabase
    .from("property_data")
    .insert([
      {
        name: data?.name,
        status: data?.status,
        price: data?.price,
        available_shares: data?.availableShares,
        totalShares: data?.availableShares,
        location: data?.location,
        type: data?.type,
        image: data?.image,
        attributes: data?.attributes,
        value_parameters: data?.valueParameters,
        updates: data?.updates,
        growth: data?.growth,
        description: data?.description,
      },
    ])
    .select();

  return c.json({
    success: true,
    message: "Created new properties.",
    data: dbData,
  });
});

property.delete("/", async (c) => {
  const body = await c.req.json();
  const { success, data, error } = deletePropertySchema.safeParse(body);

  if (!success) {
    return c.json({
      success: false,
      error,
    });
  }

  const { data: dbData, error: dbError } = await supabase
    .from("property_data")
    .delete()
    .eq("id", data.id)
    .select();

  if (!data) {
    return c.json({
      success: false,
      error: dbError,
    });
  }

  return c.json({
    success: true,
    data: dbData,
  });
});

export default property;