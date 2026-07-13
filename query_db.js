import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Let's create an RPC via REST? We can't create an RPC via REST. We need to run it in SQL editor.
  // Wait, I can just use the anon key to query `customers` and see if they link to transactions.
  const { data, error } = await supabase.from('transactions').select('*, vendors(*)').limit(1);
  console.log('Test joined:', data, error);
}
test();
