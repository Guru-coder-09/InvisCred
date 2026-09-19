const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDemo() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@msme.com',
    password: 'Password123!'
  });
  console.log("Login:", error ? error.message : "Success " + data.user.id);
  
  if (!error) {
    const { data: analyst } = await supabase.from('analysts').select('*').eq('id', data.user.id).single();
    console.log("Analyst:", analyst);
  }
}
testDemo();
