import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: rows, error } = await supabase.from('products').select('*').limit(1);
  if (rows && rows.length > 0) {
    console.log('Keys:', Object.keys(rows[0]));
  } else {
    console.log('No rows or error:', error);
  }
}
test();
