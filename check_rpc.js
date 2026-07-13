import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('adjust_bank_balance', {
    p_account_id: '00000000-0000-0000-0000-000000000000',
    p_new_balance: 100,
    p_reason: 'test'
  });
  console.log('Result:', data, 'Error:', error);
}
test();
