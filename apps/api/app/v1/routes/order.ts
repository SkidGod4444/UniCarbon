import { Hono } from "hono";
import { orderCreateSchema, orderVerifySchema } from "@/utilities/schema";
import { supabase } from "@/utilities/supabase";
import razorpay from "@/utilities/razorpay";
import { completeProject } from "@/utilities/etherjs";

const order = new Hono();

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

order.post("/create", async (c) => {
  const body = await c.req.json();
  const { success, data, error } = orderCreateSchema.safeParse(body);

  if (!success) {
    return c.json(
      {
        success: false,
        message: error.message + "1",
        error,
      },
      400
    );
  }

  const randomStr = Math.random().toString(36).substring(2, 8);
  const orderReceipt = `rcpt_${randomStr}_${Date.now()}`;

  try {
    const { data: propertyData } = await supabase
      .from("property_data")
      .select("*")
      .eq("id", data.propertyId);

    if (!propertyData || propertyData.length <= 0) {
      return c.json(
        {
          success: false,
          error: "Property could not be found",
        },
        400
      );
    }

    if (propertyData[0].available_shares < data.shares) {
      return c.json(
        {
          success: false,
          error: `Invalid request: Only ${propertyData[0].available_shares} shares are available. You can't place an order for ${data.shares} shares.`,
        },
        400
      );
    }

    const orderCreated = await razorpay.orders.create({
      amount: propertyData[0].price * data.shares * 100,
      currency: data.currency ?? "INR",
      receipt: orderReceipt,
    });

    const { data: dbData, error: dbError } = await supabase
      .from("payments")
      .insert([
        {
          user_id: data.userId,
          property_id: data.propertyId,
          amount: Number(orderCreated.amount) / 100,
          currency: orderCreated.currency,
          order_id: orderCreated.id,
          receipt_id: orderCreated.receipt,
          offer_id: orderCreated.offer_id,
          status: "created",
          shares: data.shares,
        },
      ])
      .select();

    if (orderCreated && dbData) {
      return c.json({
        success: true,
        message: "Order created successfully",
        data: orderCreated,
      });
    } else {
      console.log(dbError);
      console.log(error);

      return c.json(
        {
          success: false,
          error: "Failed to create the order",
        },
        400
      );
    }
  } catch (error) {
    console.log("Failed to create order:", error);
    return c.json(
      {
        success: false,
        error: "Internal server error",
      },
      500
    );
  }
});

order.post("/verify", async (c) => {
  const body = await c.req.json();
  const { data, success, error } = orderVerifySchema.safeParse(body);

  if (!success) {
    return c.json(
      {
        success: false,
        message: error.message + "2",
        error,
      },
      400
    );
  }

  // We can't use Node's 'crypto' in edge environments, so use Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(process.env.RAZORPAY_SECRET as string),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const dataToSign = encoder.encode(data.orderId + "|" + data.paymentId);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataToSign);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (data.razorpaySignature === expectedSignature) {
    await supabase
      .from("payments")
      .update({
        status: "success",
      })
      .eq("order_id", data.orderId);

    const { data: propertyData } = await supabase
      .from("property_data")
      .select("*")
      .eq("id", data.propertyId);

    if (!propertyData || propertyData.length <= 0) {
      return c.json(
        {
          success: false,
          error: "Invalid property id provided",
        },
        400
      );
    }

    if (propertyData[0].available_shares < data.shares) {
      return c.json(
        {
          success: false,
          error: `Payment was successful but ${data.shares} shares are not left. Maybe someone already bought it.`,
        },
        400
      );
    }

    await supabase
      .from("property_data")
      .update({
        available_shares: propertyData[0].available_shares - data.shares,
      })
      .eq("id", data.propertyId);

    const existingOwner = await supabase
      .from("owners")
      .select("*")
      .eq("user_id", data.userId)
      .eq("property_id", data.propertyId);

    if (existingOwner && existingOwner.data && existingOwner.data.length > 0) {
      await supabase
        .from("owners")
        .update({
          credits: existingOwner.data[0].credits + data.shares,
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

    console.log(data.shares, propertyData[0].name, data);
    let hash = "";
    try {
      hash = await completeProject(data.shares, propertyData[0].name);
    } catch (error) {
      console.log(`Offset error: ${error}`);
    }

    return c.json({
      success: true,
      message: `Payment successful, ${data.shares} bought successfully`,
      transaction_hash: hash,
    });
  } else {
    await supabase
      .from("payments")
      .update({
        status: "failed",
      })
      .eq("order_id", data.orderId);

    return c.json(
      {
        success: false,
        message: "Payment is not verified",
      },
      400
    );
  }
});

export default order;
