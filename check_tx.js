import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  console.log('Transactions Data:', data);
  console.log('Transactions Error:', error);
}
test();
