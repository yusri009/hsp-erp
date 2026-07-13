import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // get a valid tenant
  const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
  const tenantId = tenant.id;

  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      tenant_id: tenantId,
      date: '2026-07-13',
      category: 'Office',
      amount: 100,
      description: 'Test'
    }])
    .select()
    .single();

  console.log('Error:', error);
}
test();
