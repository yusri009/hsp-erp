import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      tenant_id: '123e4567-e89b-12d3-a456-426614174000', // Dummy UUID
      vendor_id: '123e4567-e89b-12d3-a456-426614174000', // Dummy UUID
      date: '2026-07-13',
      total_cost: 100,
      status: 'pending',
      due_date: '2026-07-20',
    })
    .select()
    .single();
  console.log('Error:', error);
}
test();
