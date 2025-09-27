
import { Hono } from "hono";
import { CONFIG } from "@/utilities/config";
import { completeProject } from "@/utilities/etherjs";
import { supabase } from "@/utilities/supabase";
import { orderCreateSchema, orderVerifySchema } from "@/utilities/schema";
import { polar } from "@/utilities/polar";

const order = new Hono();

// Get order by ID
order.get("/:orderId", async (c) => {
  const orderId = c.req.param("orderId");

  if (!orderId) {
    return c.json(
      {
        success: false,
        message: "Please provide a valid order id",
      },
      400
    );
  }

  // To be implemented
  return c.json({
    success: true,
  });
});

// Create order
order.post("/", async (c) => {
  try {
    const body = await c.req.json();
    try {
      console.debug("[Order] Incoming /order request body:", JSON.stringify(body));
    } catch (e) {
      // If body can't be stringified, still continue
      console.debug("[Order] Incoming /order request body (not stringifiable)");
    }

    const { success, data, error } = orderCreateSchema.safeParse(body);

    if (!success) {
      console.error("[Order] Validation failed:", error);
      return c.json(
        {
          success: false,
          message: error.message,
          error,
        },
        400
      );
    }

    const randomString = Math.random().toString(36).substring(2, 8);
    const orderReceipt = `rcpt_${randomString}_${Date.now()}`;

    try {
      console.debug(`[Order] Fetching property (id=${data.propertyId})`);
      const { data: propertyData, error: propertyError } = await supabase
        .from("property_data")
        .select("*")
        .eq("id", data.propertyId)
        .single();

      console.debug("[Order] property fetch result:", {
        propertyData: propertyData ?? null,
        propertyError: propertyError ?? null,
      });

      if (propertyError) {
        console.error("[Order] Supabase property fetch error:", propertyError);
        return c.json(
          {
            success: false,
            error: "Property fetch failed",
            details: propertyError?.message ?? propertyError,
          },
          400
        );
      }

      if (!propertyData) {
        console.error("[Order] Property not found for id:", data.propertyId);
        return c.json(
          {
            success: false,
            error: "Property could not be found",
          },
          400
        );
      }

      if (propertyData.available_shares < data.shares) {
        console.error(
          `[Order] Not enough shares: requested=${data.shares}, available=${propertyData.available_shares}`
        );
        return c.json(
          {
            success: false,
            error: `Invalid request: Only ${propertyData.available_shares} shares are available. You can't place an order for ${data.shares} shares.`,
          },
          400
        );
      }

      const price = Number(propertyData.price);
      console.debug("[Order] property price raw:", propertyData.price, "parsed:", price);
      if (isNaN(price) || price <= 0) {
        console.error("[Order] Invalid property price:", propertyData.price);
        return c.json(
          {
            success: false,
            error: "Invalid property price value",
          },
          400
        );
      }

      const amount = Math.round(price * data.shares * 100); // paise
      console.debug("[Order] Computed amount (paise):", amount, {
        price,
        shares: data.shares,
        currency: data.currency ?? "INR",
      });

      if (isNaN(amount) || amount <= 0) {
        console.error("[Order] Invalid amount computed:", amount);
        return c.json(
          {
            success: false,
            error: "Invalid amount calculated for the order",
          },
          400
        );
      }

      // Check if Razorpay credentials are configured
      console.debug("[Order] Razorpay key present:", !!CONFIG.razorpayKeyId, "secret present:", !!CONFIG.razorpaySecret);
      if (!CONFIG.razorpayKeyId) {
        console.error("Razorpay Key ID is not configured");
        return c.json(
          {
            success: false,
            error: "Payment gateway key ID not configured",
          },
          500
        );
      }
      if (!CONFIG.razorpaySecret) {
        console.error("Razorpay Secret is not configured");
        return c.json(
          {
            success: false,
            error: "Payment gateway secret not configured",
          },
          500
        );
      }

      console.debug("[Order] Creating Razorpay order with payload", {
        amount,
        currency: data.currency ?? "INR",
        receipt: orderReceipt,
      });

      let checkoutSession;
      try {
        // Create a product with custom pricing
        const product = await polar.products.create({
          name: `Carbon Credits - ${propertyData.name}`,
          description: `Purchase ${data.shares} shares of ${propertyData.name}`,
          prices: [{
            amountType: "fixed",
            priceAmount: Math.round(propertyData.price * data.shares * 100), // pass in cents
            priceCurrency: "usd"
          }]
        });

        // Then create checkout session
        checkoutSession = await polar.checkouts.create({
          products: [product.id],
          successUrl: "https://devwtf.in"
        });
        console.debug("[Order] Polar response:", checkoutSession);
      } catch (err) {
        console.error("[Order] Polar checkout create error:", err);
        // Return the error message (not the secret) to help debugging
        return c.json(
          {
            success: false,
            error: "Payment gateway error"
          },
          500
        );
      }

      // Persist payment record
      try {
        const { data: dbData, error: dbError } = await supabase
          .from("payments")
          .insert([
            {
              user_id: data.userId,
              property_id: data.propertyId,
              amount: amount / 100,
              currency: data.currency ?? "INR",
              order_id: checkoutSession.id,
              receipt_id: checkoutSession.id,
              status: "created",
              shares: data.shares,
            },
          ])
          .select()
          .single();

        console.debug("[Order] Supabase insert result:", {
          dbData: dbData ?? null,
          dbError: dbError ?? null,
        });

        if (dbError) {
          console.error("[Order] Database error while inserting payment:", dbError);
          return c.json(
            {
              success: false,
              error: "Failed to save order to database",
              details: dbError?.message ?? dbError,
            },
            500
          );
        }

        if (checkoutSession && dbData) {
          return c.json(
            {
              success: true,
              message: "Order created successfully",
              data: checkoutSession,
            },
            200
          );
        } else {
          console.error("[Order] Unexpected condition: checkoutSession or dbData missing", { checkoutSession, dbData });
          return c.json(
            {
              success: false,
              error: "Failed to create the order",
            },
            400
          );
        }
      } catch (dbErr) {
        console.error("[Order] Exception while saving order to DB:", dbErr);
        return c.json(
          {
            success: false,
            error: "Failed to save order to database",
            details: dbErr instanceof Error ? dbErr.message : String(dbErr),
          },
          500
        );
      }
    } catch (innerError) {
      console.error("[Order] Error inside order creation flow:", innerError instanceof Error ? innerError.stack || innerError.message : innerError);
      return c.json(
        {
          success: false,
          error: "Internal server error",
          details: innerError instanceof Error ? innerError.message : String(innerError),
        },
        500
      );
    }
  } catch (error) {
    console.error("[Order] Failed to parse request body or other outer error:", error instanceof Error ? error.stack || error.message : error);
    return c.json(
      {
        success: false,
        error: "Invalid request body",
        details: error instanceof Error ? error.message : String(error),
      },
      400
    );
  }
});

// Verify order
order.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { data, success, error } = orderVerifySchema.safeParse(body);

    if (!success) {
      return c.json(
        {
          success: false,
          message: error.message,
          error,
        },
        400
      );
    }

    // Get checkout session from Polar to verify payment status
    let checkoutSession;
    try {
      checkoutSession = await polar.checkouts.get({ id: data.orderId });
    } catch (polarError) {
      console.error("[Order] Polar checkout fetch error:", polarError);
      return c.json(
        {
          success: false,
          error: "Failed to verify payment with payment gateway",
        },
        500
      );
    }

    if (!checkoutSession) {
      return c.json(
        {
          success: false,
          error: "Checkout session not found",
        },
        404
      );
    }

    // Check if payment is completed
    if (checkoutSession.status !== "completed") {
      await supabase
        .from("payments")
        .update({
          status: "failed",
        })
        .eq("order_id", data.orderId);

      return c.json(
        {
          success: false,
          message: "Payment not completed or failed",
          details: `Payment status: ${checkoutSession.status}`,
        },
        400
      );
    }

    // Payment is verified, proceed with order completion
    const { data: paymentData } = await supabase
      .from("payments")
      .update({
        status: "success",
      })
      .eq("order_id", data.orderId)
      .select()
      .single();

    const { data: propertyData } = await supabase
      .from("property_data")
      .select("*")
      .eq("id", data.propertyId)
      .single();

    if (!propertyData) {
      return c.json(
        {
          success: false,
          error: "Invalid property id provided",
        },
        400
      );
    }

    if (propertyData.available_shares < data.shares) {
      return c.json(
        {
          success: false,
          error: `Payment was successful but ${data.shares} shares are not left. Maybe someone already bought it.`,
        },
        400
      );
      // TODO: Issue a refund
    }

    await supabase
      .from("property_data")
      .update({
        available_shares: propertyData.available_shares - data.shares,
      })
      .eq("id", data.propertyId);

    const { data: ownerData } = await supabase
      .from("owners")
      .select("*")
      .eq("user_id", data.userId)
      .eq("property_id", data.propertyId)
      .single();

    if (ownerData) {
      await supabase
        .from("owners")
        .update({
          credits: ownerData.credits + data.shares,
        })
        .eq("user_id", data.userId)
        .eq("property_id", data.propertyId);
    } else {
      await supabase.from("owners").insert([
        {
          user_id: data.userId,
          property_id: data.propertyId,
          credits: data.shares,
        },
      ]);
    }

    await completeProject(paymentData.amount, propertyData.name);

    return c.json(
      {
        success: true,
        message: `Payment successful, ${data.shares} shares bought successfully`,
        data: {
          checkoutSessionId: checkoutSession.id,
          paymentStatus: checkoutSession.status,
        },
      },
      200
    );
  } catch (error) {
    console.log("Failed to verify order:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
});

export default order;
