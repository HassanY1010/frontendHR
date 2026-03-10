// vite.config.ts
import { defineConfig } from "file:///C:/Users/HP/Desktop/HR/node_modules/.pnpm/vite@4.5.0_@types+node@20.0.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/HP/Desktop/HR/node_modules/.pnpm/@vitejs+plugin-react@4.0.0_vite@4.5.0/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\HP\\Desktop\\HR\\apps\\owner-dashboard";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@hr/ui": path.resolve(__vite_injected_original_dirname, "../../packages/ui/src"),
      "@hr/services": path.resolve(__vite_injected_original_dirname, "../../packages/services/src"),
      "@hr/types": path.resolve(__vite_injected_original_dirname, "../../packages/types/src"),
      "@hr/utils": path.resolve(__vite_injected_original_dirname, "../../packages/utils/src"),
      "@hr/constants": path.resolve(__vite_injected_original_dirname, "../../packages/constants/src")
    }
  },
  server: {
    port: 3004,
    host: true
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "@hr/ui"],
          charts: ["recharts"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXEhSXFxcXGFwcHNcXFxcb3duZXItZGFzaGJvYXJkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXEhSXFxcXGFwcHNcXFxcb3duZXItZGFzaGJvYXJkXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9IUC9EZXNrdG9wL0hSL2FwcHMvb3duZXItZGFzaGJvYXJkL3ZpdGUuY29uZmlnLnRzXCI7Ly8gYXBwcy9vd25lci1kYXNoYm9hcmQvdml0ZS5jb25maWcudHNcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgJ0Boci91aSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy91aS9zcmMnKSxcclxuICAgICAgJ0Boci9zZXJ2aWNlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9zZXJ2aWNlcy9zcmMnKSxcclxuICAgICAgJ0Boci90eXBlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy90eXBlcy9zcmMnKSxcclxuICAgICAgJ0Boci91dGlscyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy91dGlscy9zcmMnKSxcclxuICAgICAgJ0Boci9jb25zdGFudHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvY29uc3RhbnRzL3NyYycpXHJcbiAgICB9XHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDQsXHJcbiAgICBob3N0OiB0cnVlXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICB1aTogWydmcmFtZXItbW90aW9uJywgJ0Boci91aSddLFxyXG4gICAgICAgICAgY2hhcnRzOiBbJ3JlY2hhcnRzJ11cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxVQUFVLEtBQUssUUFBUSxrQ0FBVyx1QkFBdUI7QUFBQSxNQUN6RCxnQkFBZ0IsS0FBSyxRQUFRLGtDQUFXLDZCQUE2QjtBQUFBLE1BQ3JFLGFBQWEsS0FBSyxRQUFRLGtDQUFXLDBCQUEwQjtBQUFBLE1BQy9ELGFBQWEsS0FBSyxRQUFRLGtDQUFXLDBCQUEwQjtBQUFBLE1BQy9ELGlCQUFpQixLQUFLLFFBQVEsa0NBQVcsOEJBQThCO0FBQUEsSUFDekU7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUNqRCxJQUFJLENBQUMsaUJBQWlCLFFBQVE7QUFBQSxVQUM5QixRQUFRLENBQUMsVUFBVTtBQUFBLFFBQ3JCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
