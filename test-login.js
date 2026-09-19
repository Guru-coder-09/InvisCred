const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log("Testing login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'tejaguru@gmail.com',
    password: 'Guru@2007',
  });

  if (error) {
    console.error("Login failed:", error.message);
  } else {
    console.log("Login successful! User ID:", data.user.id);
  }
}

testLogin();
