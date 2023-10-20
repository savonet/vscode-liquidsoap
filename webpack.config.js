//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "webworker",
  entry: "./src/extension.ts",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
    extensions: [".ts", ".js"],
    fallback: {
      child_process: false,
      constants: false,
      fs: false,
      tty: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};
module.exports = config;
