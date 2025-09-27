import { Hono } from "hono";
import { CONFIG } from "@/utilities/config";
import { offsetAgainstProject } from "@/utilities/etherjs";
import { supabase } from "@/utilities/supabase";
import { offsetSchema } from "@/utilities/schema";

const offset = new Hono();

offset.post("/", async (c) => {
  try {
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
        .eq("property_id", data.propertyId)
        .single();

      const { data: propertyData, error: propertyError } = await supabase
        .from("property_data")
        .select("*")
        .eq("id", data.propertyId)
        .single();

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

      if (data.credits > ownerData.credits) {
        return c.json(
          {
            success: false,
            error: `You don't have enough credits. Available credits: ${ownerData.credits}`,
          },
          400
        );
      }

      const remainingCredits = ownerData.credits - data.credits;

      if (remainingCredits === 0) {
        const { error: deleteError } = await supabase
          .from("owners")
          .delete()
          .eq("user_id", ownerData.user_id)
          .eq("property_id", ownerData.property_id);

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
          .eq("user_id", ownerData.user_id)
          .eq("property_id", ownerData.property_id);

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
      }

      // Offset credits in Blockchain
      let hash = "";
      try {
        hash = await offsetAgainstProject(
          data.credits,
          CONFIG.companyAddress,
          data.beneficiaryAddress,
          propertyData.name
        );
      } catch (error) {
        console.log(`Offset error: ${error}`);

        if (remainingCredits === 0) {
          // Restore the deleted record
          await supabase.from("owners").insert({
            user_id: ownerData.user_id,
            property_id: ownerData.property_id,
            credits: data.credits,
          });
        } else {
          // Restore the original credits
          await supabase
            .from("owners")
            .update({ credits: ownerData.credits })
            .eq("user_id", ownerData.user_id)
            .eq("property_id", ownerData.property_id);
        }

        return c.json(
          {
            success: false,
            error: "Blockchain transaction failed",
            message: error instanceof Error ? error.message : String(error),
          },
          400
        );
      }

      if (hash !== "" && hash !== null) {
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
          return c.json(
            {
              success: true,
              message: `Offsetted ${data.credits} successfully`,
              data: {
                ...dbData,
                companyName: propertyData.name,
              },
            },
            200
          );
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
  } catch (error) {
    console.log("Failed to parse request body:", error);
    return c.json(
      {
        success: false,
        error: "Invalid request body",
      },
      400
    );
  }
});

export default offset;
