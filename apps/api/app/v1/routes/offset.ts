import { CONFIG } from "@/utilities/config";
import { offsetAgainstProject } from "@/utilities/etherjs";
import { offsetSchema } from "@/utilities/schema";
import { supabase } from "@/utilities/supabase";
import { Hono } from "hono";

const offset = new Hono();

offset.post("/", async (c) => {
  const body = await c.req.json();
  const { success, data, error } = offsetSchema.safeParse(body);

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

  try {
    const { data: ownerData, error: ownerError } = await supabase
      .from("owners")
      .select("*")
      .eq("user_id", data.userId)
      .eq("property_id", data.propertyId);

    const { data: propertyData, error: propertyError } = await supabase
      .from("property_data")
      .select("*")
      .eq("id", data.propertyId);

    if (!ownerData || ownerError || !propertyData || propertyError) {
      console.log(ownerError);
      console.log(propertyError);
      return c.json(
        {
          success: false,
          error: "Failed to offset credits - 1",
        },
        400
      );
    }

    if (data.credits > ownerData[0].credits) {
      return c.json(
        {
          success: false,
          error: `You don't have enough credits. Available credits: ${ownerData[0].credits}`,
        },
        400
      );
    }

    const remainingCredits = ownerData[0].credits - data.credits;

    if (remainingCredits === 0) {
      const { error: deleteError } = await supabase
        .from("owners")
        .delete()
        .eq("user_id", ownerData[0].user_id)
        .eq("property_id", ownerData[0].property_id);

      if (deleteError) {
        console.log(deleteError);
        return c.json(
          {
            success: false,
            error: "Failed to offset credits - 2",
          },
          400
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("owners")
        .update({
          credits: remainingCredits,
        })
        .eq("user_id", ownerData[0].user_id)
        .eq("property_id", ownerData[0].property_id);

      if (updateError) {
        console.log(updateError);
        return c.json(
          {
            success: false,
            error: "Failed to offset credits - 3",
          },
          400
        );
      }

      // Offset credits in Blockchain
      let hash = "";
      try {
        hash = await offsetAgainstProject(
          data.credits,
          CONFIG.companyAddress,
          data.beneficiaryAddress,
          propertyData[0].name
        );
      } catch (error) {
        console.log(`Offset error: ${error}`);

        if (remainingCredits === 0) {
          await supabase.from("owners").insert({
            id: propertyData[0].id,
            user_id: ownerData[0].user_id,
            property_id: ownerData[0].property_id,
            credits: data.credits,
          });
        } else {
          await supabase
            .from("owners")
            .update({ credits: ownerData[0].credits })
            .eq("user_id", ownerData[0].user_id)
            .eq("property_id", ownerData[0].property_id);
        }

        return c.json(
          {
            success: false,
            error: "Blockchain transaction failed",
            message: error,
          },
          400
        );
      }

      if (hash !== "" || hash !== null) {
        const { data: dbData, error: dbError } = await supabase
          .from("offset")
          .insert([
            {
              user_id: data.userId,
              property_id: data.propertyId,
              credits: data.credits,
              description: data.description,
              transaction_hash: hash,
              beneficiary_address: data.beneficiaryAddress,
              beneficiary_name: data.beneficiaryName,
            },
          ])
          .select()
          .single();

        if (dbData) {
          return c.json({
            success: true,
            message: `Offsetted ${data.credits} successfully`,
            data: dbData,
          });
        } else {
          console.log(dbError);
          console.log(error);

          return c.json(
            {
              success: false,
              error: "Failed to offset credits - 4",
            },
            400
          );
        }
      }
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

export default offset;
