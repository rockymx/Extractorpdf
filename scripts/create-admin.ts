import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = '2dcommx02@gmail.com';
  const password = 'Roge#98023992';

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }

    console.log('User created:', authData.user.id);

    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .insert({
        user_id: authData.user.id,
        role: 'admin'
      });

    if (settingsError) {
      console.error('Error creating user settings:', settingsError);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
