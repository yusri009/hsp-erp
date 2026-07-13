import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Let's get the OpenAPI schema definition of transactions
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const data = await res.json();
  const txCols = data.definitions.transactions.properties;
  console.log(Object.keys(txCols));
}
test();
