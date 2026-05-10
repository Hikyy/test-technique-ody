const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;

const SINGLETONS = [
  "react",
  "react-dom",
  "react-native",
  "@tanstack/react-query",
  "@tanstack/query-core",
];

config.resolver.extraNodeModules = SINGLETONS.reduce((acc, pkg) => {
  acc[pkg] = path.resolve(projectRoot, "node_modules", pkg);
  return acc;
}, {});

module.exports = withNativeWind(config, { input: "./global.css" });
