import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function deleteUserByEmail(email) {
  try {
    // 1. Find user by email
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find((u) => u.email === email);
    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    // 2. Delete user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    console.log(`Successfully deleted user ${email} (ID: ${user.id})`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

const emailToDelete = "ej062017@gmail.com";
deleteUserByEmail(emailToDelete);
