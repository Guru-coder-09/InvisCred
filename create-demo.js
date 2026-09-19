const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDemoUser() {
  console.log("Creating demo user...");
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: 'demo@msme.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Demo Analyst',
      role: 'admin',
      branch: 'Mumbai HQ'
    }
  });

  if (error) {
    console.error("Error:", error.message);
    return;
  }
  
  console.log("User created:", user.user.id);
  
  await new Promise(r => setTimeout(r, 1500));
  
  await supabase.from('analysts').insert({
    id: user.user.id,
    email: 'demo@msme.com',
    full_name: 'Demo Analyst',
    role: 'admin',
    branch: 'Mumbai HQ'
  }).catch(e => console.log("Already exists or error", e));
}

createDemoUser();
