{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20    pkgs.nodePackages.pnpm,
,
    pkgs.deno
  ];
  env = {
    VITE_SUPABASE_URL = "https://iomeddeasarntjhqzndu.supabase.co";
    VITE_SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE"; # Replace with your actual key
  };
  idx.extensions = [
    "dbaeumer.vscode-eslint"
  ];
  idx.previews = {
    previews = {
      app = {
        command = [ "npm", "run", "dev", "--", "--port", "$PORT", "--host", "0.0.0.0" ];
        manager = "web";
      };
    };
  };
}
