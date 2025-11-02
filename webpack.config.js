const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isAnalyze = env && env.analyze;
  
  return {
    target: 'node',
    mode: argv.mode || 'production',
    entry: './src/index.js',
    output: {
      filename: 'server.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    // For Node.js applications, exclude most node_modules to avoid bundling issues
    externals: [
      /^[a-z\-0-9]+$/, // Exclude all npm packages
      // Keep some specific includes if needed
    ],
    resolve: {
      extensions: ['.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    node: '22'
                  }
                }]
              ]
            }
          }
        }
      ]
    },
    plugins: [
      ...(isAnalyze ? [new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html'
      })] : [])
    ],
    stats: {
      errorDetails: true,
    },
    optimization: {
      minimize: false, // Disabled for Node.js apps and debugging
    }
  };
};