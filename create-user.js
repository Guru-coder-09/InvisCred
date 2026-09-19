const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key to bypass email confirmation and create a verified user instantly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service key has admin privileges
);

async function createVerifiedUser() {
  console.log("Creating verified user...");
  
  // 1. Create user with autoConfirm
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: 'tejaguru@gmail.com',
    password: 'Guru@2007',
    email_confirm: true,
    user_metadata: {
      full_name: 'Teja Guru',
      role: 'admin',
      branch: 'Mumbai HQ'
    }
  });

  if (error) {
    console.error("Error creating user:", error.message);
    return;
  }
  
  console.log("User created successfully:", user.user.id);
  
  // Wait a second for trigger to fire
  await new Promise(r => setTimeout(r, 1500));
  
  // Verify analyst record exists
  const { data: analyst } = await supabase
    .from('analysts')
    .select('*')
    .eq('id', user.user.id)
    .single();
    
  if (analyst) {
    console.log("Analyst profile ready:", analyst);
  } else {
    console.log("Trigger didn't create profile, inserting manually...");
    await supabase.from('analysts').insert({
      id: user.user.id,
      email: 'tejaguru@gmail.com',
      full_name: 'Teja Guru',
      role: 'admin',
      branch: 'Mumbai HQ'
    });
    console.log("Analyst profile manually created.");
  }
}

createVerifiedUser();
