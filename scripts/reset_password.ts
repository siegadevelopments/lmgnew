import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = envFile.split('\n').reduce((acc: any, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  }
  return acc;
}, {});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const email = "siegapython@gmail.com";
  const newPassword = "Babyraqz15!**";

  console.log(`Searching for user: ${email}`);
  
  let user = null;
  let page = 1;
  while(true) {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError || !usersData?.users?.length) break;
    
    user = usersData.users.find(u => u.email === email);
    if (user) break;
    page++;
  }

  if (!user) {
    console.log(`User with email ${email} not found. Creating user...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true,
    });
    if (error) {
      console.error("Failed to create user:", error);
      process.exit(1);
    }
    user = data.user;
    console.log(`Created user ${user.id}`);
  } else {
    console.log(`Found user ${user.id}. Updating password...`);
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true
    });
    if (error) {
      console.error("Failed to update password:", error);
      process.exit(1);
    }
    console.log("Password updated successfully!");
  }

  // Ensure they are an admin
  console.log("Setting role to admin in profiles table...");
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (profileError) {
    console.error("Failed to update profile role:", profileError);
    // Might need to insert if it doesn't exist
    await supabase.from('profiles').insert({ id: user.id, role: 'admin' });
  }
  
  console.log("All done! User is now an admin with the specified password.");
}

resetPassword();
