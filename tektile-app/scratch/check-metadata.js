
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetadata() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, adorable_metadata')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Project ID:', data[0].id);
    console.log('Project Name:', data[0].name);
    console.log('VM Metadata:', JSON.stringify(data[0].adorable_metadata?.vm, null, 2));
  } else {
    console.log('No projects found');
  }
}

checkMetadata();
