const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignup() {
  console.log("Attempting signup...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test_agent_debug@example.com',
    password: 'Password123!',
    options: {
      data: {
        full_name: 'Agent Debug',
        role: 'admin',
        branch: 'Debug HQ'
      }
    }
  });

  if (error) {
    console.error("Signup Error:", error);
  } else {
    console.log("Signup Success:", data.user?.id);
    
    // Check if trigger worked
    const { data: analyst, error: analystErr } = await supabase
      .from('analysts')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (analystErr) {
      console.error("Analyst fetch error (trigger probably failed):", analystErr);
    } else {
      console.log("Analyst record created successfully:", analyst);
    }
  }
}

testSignup();
