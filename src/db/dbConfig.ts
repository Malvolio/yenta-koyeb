const { username: user, password } = JSON.parse(
  process.env.DATABASE_USER_PASSWORD || "{}"
);

const dbConfig = {
  host: process.env.DATABASE_HOST || "",
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME || "",
  user,
  password,
  ssl: true,
};

export default dbConfig;
