/*
  # Initial Setup Migration

  1. New Tables
    - `app_settings` - Tabla para almacenar configuraciones de la aplicación
      - `id` (uuid, primary key)
      - `key` (text, unique) - Nombre de la configuración
      - `value` (text) - Valor de la configuración
      - `created_at` (timestamptz) - Fecha de creación
      - `updated_at` (timestamptz) - Fecha de actualización

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for public read access (para que la app pueda leer configuraciones)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to app settings"
  ON app_settings
  FOR SELECT
  TO anon
  USING (true);
