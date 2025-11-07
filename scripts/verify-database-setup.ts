import { supabase } from '../services/supabaseClient';

async function verifyDatabaseSetup() {
  console.log('='.repeat(60));
  console.log('DATABASE SETUP VERIFICATION');
  console.log('='.repeat(60));

  try {
    console.log('\n1. Checking if get_all_users_admin function exists and includes is_active...');
    const { data: functionData, error: functionError } = await supabase.rpc('get_all_users_admin');

    if (functionError) {
      console.error('❌ Error calling get_all_users_admin:', functionError);
      console.log('\n🔍 This might mean:');
      console.log('   - The function does not exist');
      console.log('   - You are not an admin user');
      console.log('   - The migration has not been applied');
    } else {
      console.log('✅ Function get_all_users_admin is callable');

      if (functionData && functionData.length > 0) {
        const firstUser = functionData[0];
        console.log('\n📋 Sample user data structure:', JSON.stringify(firstUser, null, 2));

        if ('is_active' in firstUser) {
          console.log('✅ is_active field is present in the response');
        } else {
          console.log('❌ is_active field is MISSING from the response');
          console.log('   Available fields:', Object.keys(firstUser));
        }
      } else {
        console.log('⚠️  No users returned (might be due to RLS or empty database)');
      }
    }

    console.log('\n2. Checking user_settings table structure...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);

    if (settingsError) {
      console.error('❌ Error querying user_settings:', settingsError);
    } else {
      if (settingsData && settingsData.length > 0) {
        console.log('✅ user_settings table is accessible');
        console.log('📋 Table structure:', Object.keys(settingsData[0]));

        if ('is_active' in settingsData[0]) {
          console.log('✅ is_active column exists in user_settings table');
        } else {
          console.log('❌ is_active column is MISSING from user_settings table');
        }
      } else {
        console.log('⚠️  No settings records found');
      }
    }

    console.log('\n3. Checking RLS policies on user_settings...');
    const { data: policiesData, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_settings');

    if (policiesError) {
      console.log('⚠️  Could not check policies (might need database access)');
    } else {
      console.log(`✅ Found ${policiesData?.length || 0} policies on user_settings table`);
      if (policiesData && policiesData.length > 0) {
        policiesData.forEach(policy => {
          console.log(`   - ${policy.policyname}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
  }
}

verifyDatabaseSetup();
