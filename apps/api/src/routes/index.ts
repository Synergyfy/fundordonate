import { Router } from "express";
import { authRouter } from "./auth";
import { campaignsRouter } from "./campaigns";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/campaigns", campaignsRouter);

apiRouter.get("/", (_req, res) => {
  res.json({ message: "FundorDonate API v1" });
});

export { apiRouter };
