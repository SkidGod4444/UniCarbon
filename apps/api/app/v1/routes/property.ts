import { Hono } from "hono";
import { supabase } from "@/utilities/supabase";
import { propertyCreateSchema, deletePropertySchema } from "@/utilities/schema";

const property = new Hono();

// Get all properties
property.get("/all", async (c) => {
  try {
    const { data, error } = await supabase
      .from("property_data")
      .select("*");

    if (error) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log("Failed to fetch properties:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
});

// Get property by ID
property.get("/:propertyId", async (c) => {
  try {
    const propertyId = c.req.param("propertyId");

    if (!propertyId) {
      return c.json(
        {
          success: false,
          error: "Please provide a valid property id",
        },
        400
      );
    }

    const { data, error } = await supabase
      .from("property_data")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (!data || error) {
      return c.json(
        {
          success: false,
          error: "No property found with that id",
        },
        400
      );
    }

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log("Failed to fetch property:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
});

// Create property
property.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { success, data, error } = propertyCreateSchema.safeParse(body);

    if (!success) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    const { data: dbData, error: dbError } = await supabase
      .from("property_data")
      .insert([
        {
          name: data.name,
          status: data.status,
          price: data.price,
          available_shares: data.availableShares,
          totalShares: data.availableShares,
          location: data.location,
          type: data.type,
          image: data.image,
          attributes: data.attributes,
          value_parameters: data.valueParameters,
          updates: data.updates,
          growth: data.growth,
          description: data.description,
        },
      ])
      .select();

    if (dbError) {
      console.log("Database error:", dbError);
      return c.json(
        {
          success: false,
          error: "Failed to create property",
        },
        400
      );
    }

    return c.json(
      {
        success: true,
        message: "Created new property successfully",
        data: dbData,
      },
      201
    );
  } catch (error) {
    console.log("Failed to create property:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
});

// Delete property
property.delete("/", async (c) => {
  try {
    const body = await c.req.json();
    const { success, data, error } = deletePropertySchema.safeParse(body);

    if (!success) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    const { data: dbData, error: dbError } = await supabase
      .from("property_data")
      .delete()
      .eq("id", data.id)
      .select();

    if (dbError) {
      console.log("Database error:", dbError);
      return c.json(
        {
          success: false,
          error: "Failed to delete property",
        },
        400
      );
    }

    if (!dbData || dbData.length === 0) {
      return c.json(
        {
          success: false,
          error: "Property not found",
        },
        404
      );
    }

    return c.json(
      {
        success: true,
        message: "Property deleted successfully",
        data: dbData,
      },
      200
    );
  } catch (error) {
    console.log("Failed to delete property:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
});

export default property;
