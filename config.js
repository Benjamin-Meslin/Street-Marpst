// ============================================================
//  config.js — à remplir avec tes propres clés
//  NE PAS commiter ce fichier avec de vraies clés (voir .gitignore)
// ============================================================

const CONFIG = {

  // --- Supabase ---
  // Récupère ces valeurs sur : https://supabase.com → ton projet → Settings → API
  SUPABASE_URL: 'https://xaiocymsrtxpzhttcrre.supabase.co/rest/v1/',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhaW9jeW1zcnR4cHpodHRjcnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mzk5NjEsImV4cCI6MjA5NjUxNTk2MX0.oNHLKK5xd34KhT0IXHt2Hoz207RqU5Cq3x5ea8tUZec',

  // --- Cloudinary ---
  // Récupère ces valeurs sur : https://cloudinary.com → Dashboard
  CLOUDINARY_CLOUD_NAME: 'dcovuexex',
  CLOUDINARY_UPLOAD_PRESET: 'tags_unsigned', // Upload preset non signé (à créer dans Cloudinary)

  // --- Carte ---
  // Centre par défaut de la carte (Saint-Étienne)
  MAP_CENTER: [45.4397, 4.3872],
  MAP_ZOOM: 14,

};
