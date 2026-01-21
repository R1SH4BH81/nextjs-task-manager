import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "access",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "refresh",
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d"
};

