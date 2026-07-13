import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('reload_schema'); // wait, the user didn't mention this. But wait, I can just reload the schema using a pg-meta query if I had access. I don't.
}
test();
