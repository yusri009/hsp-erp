import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Let's try to fetch a vendor transaction if any exists
  const { data, error } = await supabase.from('transactions').select('*').limit(5);
  console.log('Transactions:', data);
  if (error) console.log('Error:', error);
}
test();
