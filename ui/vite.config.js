export default {
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
    },
    server: {
        proxy: {
            "/add_node": {
                target: "http://localhost:8111",
                changeOrigin: true,
            },
        },
    },
};
