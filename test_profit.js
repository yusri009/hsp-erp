import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://vnfenbwdmgeyvzkyvwhy.supabase.co';
const supabaseKey = 'sb_publishable_KegwY_PRFI3OFFnga8SYLw_TyHWpoHj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Test the RPC without auth (will fail but shows function existence)
  const { data, error } = await supabase.rpc('get_dashboard_profit_summary');
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', JSON.stringify(error, null, 2));

  // Also check if there are any delivered orders
  const { data: orders, error: ordersErr } = await supabase
    .from('sales_orders')
    .select('id, status, total_amount')
    .limit(5);
  console.log('\nOrders:', JSON.stringify(orders, null, 2));
  console.log('Orders Error:', JSON.stringify(ordersErr, null, 2));

  // Check sales_order_items
  const { data: items, error: itemsErr } = await supabase
    .from('sales_order_items')
    .select('id, order_id, product_id, quantity, unit_price')
    .limit(5);
  console.log('\nItems:', JSON.stringify(items, null, 2));
  console.log('Items Error:', JSON.stringify(itemsErr, null, 2));

  // Check products avg_cost
  const { data: products, error: prodsErr } = await supabase
    .from('products')
    .select('id, sku, avg_cost, selling_price')
    .limit(5);
  console.log('\nProducts:', JSON.stringify(products, null, 2));
  console.log('Products Error:', JSON.stringify(prodsErr, null, 2));
}
test();
