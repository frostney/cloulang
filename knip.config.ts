export default {
  entry: [
    "index.{js,ts}",
    "src/index.{js,ts}",
    "spec/**/*.{js,ts}",
    "bin/index.{js,ts}",
  ],
  project: ["**/*.{js,ts}"],
  ignoreBinaries: ["eslint"],
};
