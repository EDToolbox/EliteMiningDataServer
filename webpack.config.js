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
    externals: {
      // Exclude node_modules from bundle for Node.js applications
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
      'mongodb-client-encryption': 'mongodb-client-encryption',
      'aws4': 'aws4',
      'kerberos': 'kerberos',
      '@mongodb-js/zstd': '@mongodb-js/zstd',
      'snappy': 'snappy',
      '@aws-sdk/credential-providers': '@aws-sdk/credential-providers',
      'gcp-metadata': 'gcp-metadata',
      'socks': 'socks',
      'zeromq': 'zeromq',
    },
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
      minimize: false, // Deaktiviert für Node.js-Apps und zur Fehlerbehebung
    }
  };
};