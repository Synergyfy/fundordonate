import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./lib/logger";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API: http://localhost:${PORT}/api/v1`);
});
