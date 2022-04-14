const path = require('path');

module.exports = (env) => {
    return {
        entry: './src/web.ts',
        mode: env.production ? 'production' : 'development',
        module: {
            rules: [
                {
                    test: /\.ts?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist_web'),
        },
        devServer: {
            static: {
                directory: path.join(__dirname, 'test'),
            },
            compress: true,
            port: 8080,
            historyApiFallback: {
                index: 'index.html'
            },
        },
    }
};