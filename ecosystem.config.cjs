module.exports = {
  apps: [
    {
      name: "1strep",
      script: "dist/index.js",
      cwd: __dirname,
      node_args: "--env-file=.env",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
