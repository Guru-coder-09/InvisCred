const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmAllUsers() {
  console.log("Fetching all users...");
  
  // Get all users
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  const unconfirmedUsers = data.users.filter(u => !u.email_confirmed_at);
  console.log(`Found ${unconfirmedUsers.length} unconfirmed users.`);
  
  for (const user of unconfirmedUsers) {
    console.log(`Confirming user: ${user.email}`);
    
    // Auto-confirm the user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error(`Failed to confirm ${user.email}:`, updateError.message);
    } else {
      console.log(`Successfully confirmed ${user.email}!`);
      
      // Double check if analyst record exists, just in case trigger failed
      const { data: analyst } = await supabase.from('analysts').select('*').eq('id', user.id).single();
      if (!analyst) {
        console.log(`Creating missing analyst profile for ${user.email}...`);
        await supabase.from('analysts').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: user.user_metadata?.role || 'junior_analyst',
          branch: user.user_metadata?.branch || 'Mumbai HQ'
        });
      }
    }
  }
  
  console.log("Done!");
}

confirmAllUsers();
