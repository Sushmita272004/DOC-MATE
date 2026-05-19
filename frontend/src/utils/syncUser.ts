import { createClient } from "@supabase/supabase-js";
import type { UserResource } from "@clerk/types";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export const syncUserToSupabase = async (user: UserResource) => {
  try {
    const {
      id,
      emailAddresses,
      phoneNumbers,
      firstName,
      lastName,
      createdAt,
    } = user;

    const email = emailAddresses?.[0]?.emailAddress ?? null;
    const phone = phoneNumbers?.[0]?.phoneNumber ?? null;
    const created_at = createdAt ? new Date(createdAt) : new Date();

    const { data, error } = await supabase.from("users").upsert([
      {
        id,
        email,
        phone,
        first_name: firstName ?? "",
        last_name: lastName ?? "",
        created_at,
      },
    ]);

    if (error) {
      console.error("❌ Error syncing user to Supabase:", error);
    } else {
      console.log("✅ User synced to Supabase:", data);
    }
  } catch (err) {
    console.error("❌ Unexpected error in syncUserToSupabase:", err);
  }
};
